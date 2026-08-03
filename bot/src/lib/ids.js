export const IDS = {
  // Tickets
  openTicket: "fp_open_ticket",
  closeTicket: "fp_close_ticket",

  // Ranks
  rankSelect: "fp_rank_select",

  // Top-up flow
  topupModal: "fp_topup_modal",
  topupUserId: "fp_topup_user_id",
  topupZoneId: "fp_topup_zone_id",
  topupPackageSelect: "fp_topup_package",

  // Giveaway
  giveawayJoin: "fp_giveaway_join",

  // Prices
  pricesShop: "fp_prices_shop",

  // Broadcast (existing)
  createBroadcast: "fp_create_broadcast",
  broadcastModal: "fp_broadcast_modal",
  fieldChannel: "fp_broadcast_channel",
  fieldTitle: "fp_broadcast_title",
  fieldDescription: "fp_broadcast_description",
  fieldColor: "fp_broadcast_color",
};

export const RANK_TIERS = [
  {
    value: "rank_tier1",
    label: "Warrior / Elite / Master",
    roleName: "Rank · Warrior–Master",
    color: 0x8b9bb4,
    description: "Early & mid climb",
  },
  {
    value: "rank_tier2",
    label: "Grandmaster / Epic",
    roleName: "Rank · Grandmaster–Epic",
    color: 0x9b59b6,
    description: "Competitive mid-high",
  },
  {
    value: "rank_tier3",
    label: "Legend",
    roleName: "Rank · Legend",
    color: 0xe67e22,
    description: "High elo presence",
  },
  {
    value: "rank_tier4",
    label: "Mythic / Glory / Immortal",
    roleName: "Rank · Mythic+",
    color: 0xffd700,
    description: "Peak ladder",
  },
];
