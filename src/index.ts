/*

MIT License

Copyright (c) 2021 Jakob de Guzman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import WebsocketManager from "./WebsocketManager";

class EventEmitter {
  private events: EventEmitterEvent[] = [];

  public on(event: ClientEvent, func: Function): void {
    this.events.push({
      event,
      func,
    });
  }

  public emit(event: ClientEvent, args?: any) {
    const array = this.events.filter((x) => x.event == event);

    array.forEach((element) => {
      if (args) element.func(args);
      else element.func();
    });
  }
}

interface EventEmitterEvent {
  event: string;
  func: Function;
}

export class Client extends EventEmitter {
  private ws!: WebsocketManager;

  /**
   * @type {string} token - The client's token.
   */
  public token!: string;
  /**
   * @type {ClientUser} user - The client's user.
   */
  public user!: ClientUser;
  /**
   * @type {Room} - The client's current room.
   */
  public room!: Room;

  /**
   * @constructor
   * @param {Handling} handling - The client's settings.
   */
  public constructor(
    public handling: Handling = { arr: "1", das: "1", sdf: "5", safelock: true }
  ) {
    super();

    this.ws = new WebsocketManager(this);

    this.room = new Room(this.ws);
  }

  /**
   * @returns {void}
   * @param {string} token - The client's token.
   */

  public login(token: string): void {
    this.token = token;
    this.ws.connect();
  }

  /**
   * @returns {void}
   * @param {string} room - The room to join.
   */
  public joinRoom(room: string): void {
    if (this.room.id) {
      this.leaveRoom();
    }

    this.ws.send({ id: this.ws.messageID, command: "joinroom", data: room });

    this.room.id = room;
  }
  /**
   * @returns {void}
   */
  public leaveRoom(): void {
    this.ws.send({ id: this.ws.messageID, command: "leaveroom", data: false });

    this.room.id = undefined;
  }
  /**
   * @returns {void}
   */
  public destroy(): void {
    this.ws.disconnect();
  }
}

export class ClientUser {
  /**
   * @constructor
   * @param {string} id - The client's ID.
   */
  public constructor(private ws: WebsocketManager) {}

  /* Methods */
  /**
   * @returns {void}
   * @param {string} user - The user to send the message to.
   * @param {string} message - The message content.
   */
  public message(user: string, message: string): void {
    this.ws.send({
      command: "social.dm",
      data: { recipient: user, msg: message },
    });
  }

  public setPresence(options: {
    status: "online" | "away" | "busy" | "invisible";
    detail:
      | ""
      | "menus"
      | "40l"
      | "blitz"
      | "zen"
      | "custom"
      | "lobby_end:X-QP"
      | "lobby_spec:X-QP"
      | "lobby_ig:X-QP"
      | "lobby:X-QP"
      | "lobby_end:X-PRIV"
      | "lobby_spec:X-PRIV"
      | "lobby_ig:X-PRIV"
      | "lobby:X-PRIV"
      | "tl_mn"
      | "tl"
      | "tl_end"
      | "tl_mn_complete"
      | string;
  }): void {
    this.ws.send({ command: "social.presence", data: options });
  }

  public invite(user: string): void {
    this.ws.send({ command: "social.invite", data: user });
  }
}

export class Room {
  /**
   * @type {string} id -  The room ID.
   */
  public id?: string;

  public constructor(private ws: WebsocketManager) {}

  /**
   * @returns {void}
   * @param {string} msg - The message content.
   */
  public message(msg: string): void {
    this.ws.send({ id: this.ws.messageID, command: "chat", data: msg });
  }

  /**
   * @returns {void}
   * @param {"player" | "spectator"} mode - The mode to set.
   */
  public selfMode(mode: "player" | "spectator"): void {
    this.ws.send({
      id: this.ws.messageID,
      command: "switchbracket",
      data: mode,
    });
  }
  /**
   * @returns {void}
   * @param {string} user - The user's ID.
   * @param {"player" | "spectator"} mode - The mode to set.
   */
  public setMode(user: string, mode: "player" | "spectator"): void {
    this.ws.send({
      id: this.ws.messageID,
      command: "switchbrackethost",
      data: { uid: user, bracket: mode },
    });
  }

  /**
   * @returns {void}
   * @param {{ index: string; value: any }[]} options - The configuration.
   */

  public setConfig(options: { index: string; value: any }[]): void {
    this.ws.send({
      id: this.ws.messageID,
      command: "updateconfig",
      data: options,
    });
  }
}

export interface Handling {
  arr: string;
  das: string;
  sdf: string;
  safelock: boolean;
}

export type ClientEvent =
  | "ready"
  | "message"
  | "game_update"
  | "social_dm"
  | "social_invite"
  | "social_presence"
  | "start_multiplayer";
