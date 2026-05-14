import type { BattleData, PlayerId } from "./types";

export class BattleStore {
    private battles = new Map<string, BattleData>();

    constructor() {
    }

    public saveBattle(battleID: string, battleData: BattleData) {
        this.battles.set(battleID, battleData);
    }

    private getBattle(battleId: string) {
        return this.battles.get(battleId)
    }

    public removeBattle(battleId: string) {
        this.battles.delete(battleId)
    }

    public updateRequest(battleId: string, side: PlayerId, request: unknown) {
        const battle = this.getBattle(battleId)

        if (!battle) return;

        battle.requests[side] = request;
    }

    public appendLog(battleId: string, log: string) {
        const battle = this.getBattle(battleId);

        if (!battle) return;

        battle.log.push(log)
    }
}

export const battleStore = new BattleStore();