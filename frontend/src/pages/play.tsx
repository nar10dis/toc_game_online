import { useState } from "react";

import { CardTable } from "@/components/game/CardTable";
import { ChatBox } from "@/components/game/ChatBox";
import { GameLog } from "@/components/game/GameLog";
import { SettingsMenu, type GameSettings } from "@/components/game/SettingsMenu";
import { DestinationMarkers } from "@/components/game/DestinationMarkers";
import { PawnLayer } from "@/components/game/PawnLayer";
import { PlayerAvatars } from "@/components/game/PlayerAvatars";
import { TEAM_COLORS } from "@/lib/game/boardGeometry";
import { TurnBanner } from "@/components/game/TurnBanner";
import { TurnControls } from "@/components/game/TurnControls";
import { WinScreen } from "@/components/game/WinScreen";
import { toBoardPawns } from "@/lib/game/boardPawns";
import { useChat } from "@/hooks/useChat";
import { useGame } from "@/hooks/useGame";
import { useTurnChoice } from "@/hooks/useTurnChoice";
import { Header } from "@/components/layout/Header";
import { paperStyle } from "@/lib/paperStyle";
import type { CardId } from "@/lib/game/gameTypes";
import { deadCardReason } from "@/lib/game/deadCard";

import { Board } from "@/components/game/Board";

/** Side of the board: the whole width or the whole height of its box, whichever is smaller. */
const BOARD_SIDE = "min(100cqw, 100cqh)";

export default function Play() {
  const { game, lastEvent, events, hasNoGame, sendAction } = useGame();
  const turnChoice = useTurnChoice(game, sendAction);
  let gameId: number | null = null;
  if (game) {
    gameId = game.id;
  }
  const chat = useChat(gameId);
  const [settings, setSettings] = useState<GameSettings>({
    showCellIndexes: false,
    showTutorial: false,
  });

  let content = <h2 className="text-xl">Connexion...</h2>;
  if (hasNoGame) {
    content = <h2 className="text-xl">Tu n&apos;es dans aucune partie.</h2>;
  }

  if (game) {
    const isMyTurn = game.phase === "playing" && game.currentSeat === game.mySeat;
    const playerNames = ["", "", "", ""];
    for (const player of game.players) {
      playerNames[player.seat] = player.pseudo;
    }
    const deadCardReasons: Partial<Record<CardId, string>> = {};
    for (const card of game.myHand) {
      const reason = deadCardReason(card, game);
      if (reason) deadCardReasons[card.id] = reason;
    }
    //a card is unique in the deck: the last move made with it says who played it.
    //Unknown after a reload, those cards just have no outline.
    const playedCardColors: Partial<Record<CardId, string>> = {};
    for (const event of events) {
      if ("cardId" in event.action) {
        playedCardColors[event.action.cardId] = TEAM_COLORS[event.seat];
      }
    }

    content = (
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
        {/* scrolls on short screens, so the settings at the bottom stay reachable */}
        <aside className="flex min-h-0 shrink-0 flex-col overflow-y-auto md:w-72">
          <TurnControls game={game} turnChoice={turnChoice} />
          <GameLog events={events} playerNames={playerNames} />
          <ChatBox messages={chat.messages} onSend={chat.sendMessage} />

          {/* pushed to the bottom left */}
          <div className="mt-auto">
            <SettingsMenu settings={settings} onChange={setSettings} />
          </div>
        </aside>

        {/* a size container, so the board can be the biggest square that fits in it */}
        <div
          className="flex min-h-0 flex-1 items-center justify-center"
          style={{ containerType: "size" }}
        >
          {/* the cards sit inside the same box as the board, so they scroll and zoom with it */}
          <div style={{ position: "relative", width: BOARD_SIDE, height: BOARD_SIDE }}>
            {/* everyone sees the board from their own seat, at the bottom */}
            <Board bottomSeat={game.mySeat} showIndexes={settings.showCellIndexes}>
              <PlayerAvatars
                playerTeam={game.mySeat}
                playerNames={playerNames}
                currentSeat={game.phase === "playing" ? game.currentSeat : null}
              />
              <PawnLayer
                pawns={toBoardPawns(game.pawns, lastEvent)}
                selectablePawnIds={turnChoice.selectablePawnIds}
                previewMoves={turnChoice.cardMoves}
                onPawnClick={turnChoice.handlePawnClick}
              />
              <DestinationMarkers
                destinations={turnChoice.destinations}
                color={TEAM_COLORS[game.mySeat]}
                seat={game.mySeat}
                onClick={turnChoice.handleDestinationClick}
              />
            </Board>
            {/* no cards on the board once the game is over */}
            {game.phase !== "finished" && (
              <CardTable
                hand={game.myHand}
                discardPile={game.discardPile}
                playedCardColors={playedCardColors}
                showHints={settings.showTutorial}
                deadCardReasons={deadCardReasons}
                selectedCardId={turnChoice.selectedCardId}
                canPickCard={isMyTurn && !turnChoice.isSplitInProgress}
                onCardClick={turnChoice.handleCardClick}
              />
            )}
            <TurnBanner isMyTurn={isMyTurn} mySeat={game.mySeat} />
          </div>
        </div>

        {game.phase === "finished" && game.winner !== null && (
          <WinScreen
            winnerSeat={game.winner}
            winnerName={playerNames[game.winner]}
            isMe={game.winner === game.mySeat}
          />
        )}
      </div>
    );
  }

  // one screen, no scrolling: the same header as the other pages, then the
  // board in all the room left under it
  return (
    <div className="flex h-svh w-full flex-col overflow-clip" style={paperStyle}>
      <Header />
      <main className="relative flex min-h-0 flex-1 flex-col p-4 md:p-6">
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
        radial-gradient(
          ellipse at center,
          transparent 55%,
          rgba(60, 45, 30, 0.035) 100%
        )
      `,
          }}
        />
        {content}
      </main>
    </div>
  );
}
