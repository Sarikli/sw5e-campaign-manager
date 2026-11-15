import { z } from 'zod';
import { enqueueOutbox, type WriteContext } from '../database/outbox';
import type { SqlDatabase } from '../database/types';

export const starshipSizeSchema = z.enum([
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
]);
export type StarshipSize = z.infer<typeof starshipSizeSchema>;

export const starshipCrewSlotSchema = z.object({
  role: z.enum(['pilot', 'gunner', 'mechanic', 'coordinator', 'operator']),
  characterName: z.string(),
  rank: z.number().int().min(1).max(5).default(1),
});
export type StarshipCrewSlot = z.infer<typeof starshipCrewSlotSchema>;

export const starshipSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  size: starshipSizeSchema,
  tier: z.number().int().min(0).max(5),
  ac: z.number().int().min(1),
  hullCurrent: z.number().int().min(0),
  hullMax: z.number().int().min(1),
  shieldCurrent: z.number().int().min(0),
  shieldMax: z.number().int().min(0),
  shieldRegen: z.number().int().min(0),
  flyingSpeed: z.number().int().min(0),
  turningSpeed: z.number().int().min(0),
  weapons: z.array(z.string()).default([]),
  crew: z.array(starshipCrewSlotSchema).default([]),
  version: z.number().int().min(1),
});
export type Starship = z.infer<typeof starshipSchema>;

export interface StarshipRepository {
  create(input: {
    name: string;
    size?: StarshipSize;
    tier?: number;
    ac?: number;
    hullMax?: number;
    shieldMax?: number;
    shieldRegen?: number;
    flyingSpeed?: number;
    turningSpeed?: number;
    weapons?: string[];
    crew?: StarshipCrewSlot[];
  }): Promise<Starship>;
  list(): Promise<Starship[]>;
  updateStatus(
    id: string,
    patch: {
      hullCurrent?: number;
      shieldCurrent?: number;
      tier?: number;
      crew?: StarshipCrewSlot[];
    },
  ): Promise<Starship>;
  regenerateShields(id: string): Promise<Starship>;
}

export class SqliteStarshipRepository implements StarshipRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly ctx: WriteContext,
  ) {}

  async create(input: {
    name: string;
    size?: StarshipSize;
    tier?: number;
    ac?: number;
    hullMax?: number;
    shieldMax?: number;
    shieldRegen?: number;
    flyingSpeed?: number;
    turningSpeed?: number;
    weapons?: string[];
    crew?: StarshipCrewSlot[];
  }): Promise<Starship> {
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const hullMax = input.hullMax ?? 45;
    const shieldMax = input.shieldMax ?? 25;
    const ship = starshipSchema.parse({
      id,
      name: input.name,
      size: input.size ?? 'Medium',
      tier: input.tier ?? 1,
      ac: input.ac ?? 14,
      hullCurrent: hullMax,
      hullMax,
      shieldCurrent: shieldMax,
      shieldMax,
      shieldRegen: input.shieldRegen ?? 5,
      flyingSpeed: input.flyingSpeed ?? 250,
      turningSpeed: input.turningSpeed ?? 150,
      weapons: input.weapons ?? ['Quad Laser Cannon (2d8 energy)', 'Concussion Missile Launcher (3d10 kinetic)'],
      crew: input.crew ?? [
        { role: 'pilot', characterName: 'Unassigned', rank: 1 },
        { role: 'gunner', characterName: 'Unassigned', rank: 1 },
        { role: 'mechanic', characterName: 'Unassigned', rank: 1 },
      ],
      version: 1,
    });

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO starship
          (id, name, size, tier, ac, hull_current, hull_max, shield_current, shield_max,
           shield_regen, flying_speed, turning_speed, weapons_json, crew_json,
           created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ship.id,
          ship.name,
          ship.size,
          ship.tier,
          ship.ac,
          ship.hullCurrent,
          ship.hullMax,
          ship.shieldCurrent,
          ship.shieldMax,
          ship.shieldRegen,
          ship.flyingSpeed,
          ship.turningSpeed,
          JSON.stringify(ship.weapons),
          JSON.stringify(ship.crew),
          ts,
          ts,
          this.ctx.deviceId,
        ],
      );
      await enqueueOutbox(this.db, this.ctx, 'starship', id, 'upsert', 1, ship);
    });
    return ship;
  }

  async list(): Promise<Starship[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      name: string;
      size: string;
      tier: number;
      ac: number;
      hull_current: number;
      hull_max: number;
      shield_current: number;
      shield_max: number;
      shield_regen: number;
      flying_speed: number;
      turning_speed: number;
      weapons_json: string;
      crew_json: string;
      version: number;
    }>('SELECT * FROM starship WHERE deleted_at IS NULL ORDER BY updated_at DESC');

    return rows.map((r) =>
      starshipSchema.parse({
        id: r.id,
        name: r.name,
        size: r.size,
        tier: r.tier,
        ac: r.ac,
        hullCurrent: r.hull_current,
        hullMax: r.hull_max,
        shieldCurrent: r.shield_current,
        shieldMax: r.shield_max,
        shieldRegen: r.shield_regen,
        flyingSpeed: r.flying_speed,
        turningSpeed: r.turning_speed,
        weapons: JSON.parse(r.weapons_json || '[]'),
        crew: JSON.parse(r.crew_json || '[]'),
        version: r.version,
      }),
    );
  }

  async updateStatus(
    id: string,
    patch: {
      hullCurrent?: number;
      shieldCurrent?: number;
      tier?: number;
      crew?: StarshipCrewSlot[];
    },
  ): Promise<Starship> {
    const all = await this.list();
    const existing = all.find((s) => s.id === id);
    if (!existing) throw new Error('Starship not found');

    const hullCurrent =
      patch.hullCurrent !== undefined
        ? Math.max(0, Math.min(existing.hullMax, patch.hullCurrent))
        : existing.hullCurrent;
    const shieldCurrent =
      patch.shieldCurrent !== undefined
        ? Math.max(0, Math.min(existing.shieldMax, patch.shieldCurrent))
        : existing.shieldCurrent;
    const tier = patch.tier !== undefined ? Math.max(0, Math.min(5, patch.tier)) : existing.tier;
    const crew = patch.crew ?? existing.crew;
    const version = existing.version + 1;
    const ts = this.ctx.now();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE starship
         SET hull_current = ?, shield_current = ?, tier = ?, crew_json = ?,
             updated_at = ?, version = ?, device_id = ?
         WHERE id = ?`,
        [hullCurrent, shieldCurrent, tier, JSON.stringify(crew), ts, version, this.ctx.deviceId, id],
      );
      await enqueueOutbox(this.db, this.ctx, 'starship', id, 'upsert', version, {
        id,
        hullCurrent,
        shieldCurrent,
        tier,
        crew,
      });
    });

    const updated = (await this.list()).find((s) => s.id === id);
    if (!updated) throw new Error('Starship update failed');
    return updated;
  }

  async regenerateShields(id: string): Promise<Starship> {
    const all = await this.list();
    const existing = all.find((s) => s.id === id);
    if (!existing) throw new Error('Starship not found');
    return this.updateStatus(id, {
      shieldCurrent: Math.min(existing.shieldMax, existing.shieldCurrent + existing.shieldRegen),
    });
  }
}
