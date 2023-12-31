/**
 * Copyright (C) 2023 Gnuxie <Gnuxie@protonmail.com>
 * All rights reserved.
 */

import { ActionResult, MatrixRoomID, Ok, StringUserID, isError } from "matrix-protection-suite";
import { Draupnir } from "../Draupnir";
import { ClientForUserID, RoomStateManagerFactory, joinedRoomsSafe } from "matrix-protection-suite-for-matrix-bot-sdk";
import { DraupnirClientRooms } from "./DraupnirClientRooms";
import { IConfig } from "../config";
import { makeProtectedRoomsSet } from "./DraupnirProtectedRoomsSet";

export class DraupnirFactory {
    public constructor(
        private readonly clientProvider: ClientForUserID,
        private readonly roomStateManagerFactory: RoomStateManagerFactory
    ) {
        // nothing to do.
    }

    private async makeDraupnir(clientUserID: StringUserID, managementRoom: MatrixRoomID, config: IConfig): Promise<ActionResult<Draupnir>> {
        const roomStateManager = await this.roomStateManagerFactory.getRoomStateManager(clientUserID);
        const policyRoomManager = await this.roomStateManagerFactory.getPolicyRoomManager(clientUserID);
        const roomMembershipManager = await this.roomStateManagerFactory.getRoomMembershipManager(clientUserID);
        const client = await this.clientProvider(clientUserID);
        const protectedRoomsSet = await makeProtectedRoomsSet(
            managementRoom,
            roomStateManager,
            policyRoomManager,
            roomMembershipManager,
            client,
            clientUserID
        );
        return Ok(await Draupnir.makeDraupnirBot(
            client,
            clientUserID,
            managementRoom,
            protectedRoomsSet,
            roomStateManager,
            policyRoomManager,
            roomMembershipManager,
            config
        ))
    }

    public async makeDraupnirClientRooms(
        clientUserID: StringUserID,
        managementRoom: MatrixRoomID,
        config: IConfig,
    ): Promise<ActionResult<DraupnirClientRooms>> {
        const draupnir = await this.makeDraupnir(
            clientUserID,
            managementRoom,
            config
        );
        if (isError(draupnir)) {
            return draupnir;
        }
        return await DraupnirClientRooms.makeClientRooms(
            draupnir.ok,
            async () => joinedRoomsSafe(draupnir.ok.client),
            clientUserID
        )
    }
}
