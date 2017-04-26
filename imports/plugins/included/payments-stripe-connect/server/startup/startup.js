import { Reaction, Hooks } from "/server/api";

Hooks.Events.add("afterCoreInit", () => {
  Reaction.addRolesToDefaultRoleSet({
    allShops: true,
    roleSets: ["defaultRoles", "defaultVisitorRole", "defaultSellerRoles"],
    roles: ["stripe-connect-redirect"]
  });
});
