import { Injectable } from '@nestjs/common';

// Un user peut avoir plusieurs onglets, donc on compte ses sockets
@Injectable()
export class PresenceService {
    private socketCounts = new Map<number, number>();

    // true s'il vient de passer en ligne
    connect(userId: number): boolean {
        const count = this.socketCounts.get(userId) ?? 0;
        this.socketCounts.set(userId, count + 1);
        return count === 0;
    }

    // true s'il vient de passer hors ligne
    disconnect(userId: number): boolean {
        const count = this.socketCounts.get(userId) ?? 0;
        if (count <= 1) {
            this.socketCounts.delete(userId);
            return count === 1;
        }
        this.socketCounts.set(userId, count - 1);
        return false;
    }

    isOnline(userId: number): boolean {
        return this.socketCounts.has(userId);
    }
}
