/**
 * AppConstants — all scene, door, rack, colour and player constants.
 * Consumed via static readonly members or via the backward-compat named exports below.
 */
export class AppConstants {
  // ─── Scene Dimensions ────────────────────────────────────────────────────
  static readonly ROOM_WIDTH = 14;     // m — X axis, pareti laterali alla porta
  static readonly ROOM_DEPTH = 12;     // m — Z axis, profondità (lato porta)
  static readonly WALL_HEIGHT = 4;     // m
  static readonly TILE_SIZE   = 0.6;  // 600mm raised-floor tile

  // ─── Door ─────────────────────────────────────────────────────────────────
  static readonly DOOR_FRAME_W = 2.2;
  static readonly DOOR_FRAME_H = 2.5;
  static readonly DOOR_FRAME_D = 0.2;

  // ─── Rack ─────────────────────────────────────────────────────────────────
  static readonly U_HEIGHT   = 0.04445; // 1U = 44.45 mm in metres
  static readonly RACK_UNITS = 48;
  static readonly RACK_WIDTH = 0.8;     // 800 mm
  static readonly RACK_DEPTH = 1.2;     // 1200 mm

  // ─── Colours ──────────────────────────────────────────────────────────────
  static readonly COLOR_DARK_GREY = 0x333333;

  // ─── Player ───────────────────────────────────────────────────────────────
  static readonly PLAYER_EYE_HEIGHT       = 1.7;
  static readonly PLAYER_SPEED_MAX        = 5.0;   // m/s
  static readonly PLAYER_ACCELERATION     = 30.0;  // m/s²
  static readonly PLAYER_FRICTION         = 12.0;  // m/s²
  static readonly PLAYER_BOUNDARY_MARGIN  = 0.5;
}

// ─── Backward-compat named exports (keep all consumers compiling unchanged) ──
export const ROOM_WIDTH             = AppConstants.ROOM_WIDTH;
export const ROOM_DEPTH             = AppConstants.ROOM_DEPTH;
export const WALL_HEIGHT            = AppConstants.WALL_HEIGHT;
export const TILE_SIZE              = AppConstants.TILE_SIZE;
export const DOOR_FRAME_W           = AppConstants.DOOR_FRAME_W;
export const DOOR_FRAME_H           = AppConstants.DOOR_FRAME_H;
export const DOOR_FRAME_D           = AppConstants.DOOR_FRAME_D;
export const U_HEIGHT               = AppConstants.U_HEIGHT;
export const RACK_UNITS             = AppConstants.RACK_UNITS;
export const RACK_WIDTH             = AppConstants.RACK_WIDTH;
export const RACK_DEPTH             = AppConstants.RACK_DEPTH;
export const COLOR_DARK_GREY        = AppConstants.COLOR_DARK_GREY;
export const PLAYER_EYE_HEIGHT      = AppConstants.PLAYER_EYE_HEIGHT;
export const PLAYER_SPEED_MAX       = AppConstants.PLAYER_SPEED_MAX;
export const PLAYER_ACCELERATION    = AppConstants.PLAYER_ACCELERATION;
export const PLAYER_FRICTION        = AppConstants.PLAYER_FRICTION;
export const PLAYER_BOUNDARY_MARGIN = AppConstants.PLAYER_BOUNDARY_MARGIN;
