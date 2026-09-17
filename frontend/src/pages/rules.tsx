import type { ReactNode } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { CardRule } from "@/components/rules/CardRule";
import { RulesSidebar, type RuleSection } from "@/components/rules/RulesSidebar";
import { WornFrame } from "@/components/layout/WornFrame";

const sections = {
  setup: { id: "setting-up", title: "Setting up" },
  cards: { id: "the-cards", title: "The cards" },
  moving: { id: "moving-pawns", title: "Moving pawns" },
  home: { id: "entering-home", title: "Entering home" },
  skipping: { id: "skipping-your-turn", title: "Skipping your turn" },
  winning: { id: "winning", title: "Winning" },
} satisfies Record<string, RuleSection>;

// Built once, so the aside's scroll listener is not re-attached on every render
const sectionList = Object.values(sections);

// scroll-mt keeps the title clear of the sticky header when the aside links to it
function SectionTitle({ section }: { section: RuleSection }) {
  return (
    <h2 id={section.id} className="scroll-mt-32 font-heading text-2xl font-bold">
      {section.title}
    </h2>
  );
}

function RuleList({ children }: { children: ReactNode }) {
  return <ul className="mt-4 list-disc space-y-2 pl-6 font-body text-base">{children}</ul>;
}

export default function Rules() {
  return (
    <PageLayout>
      <div className="flex w-full max-w-6xl justify-center gap-12">
        {/* self-start so the aside is only as tall as its links, and can stick below the header */}
        <aside className="sticky top-32 hidden w-52 shrink-0 self-start lg:block">
          <RulesSidebar sections={sectionList} />
        </aside>

        <div className="flex w-full max-w-4xl flex-col gap-8 pb-12">
          <div className="mb-4 text-center">
            <Title>Rules</Title>
            <Subtitle>Everything you need to know before you play.</Subtitle>
          </div>

          <WornFrame>
            <SectionTitle section={sections.setup} />
            <RuleList>
              <li>4 players play against each other, with one deck of 52 cards.</li>
              <li>Each player gets 5 cards. A random player starts.</li>
              <li>
                When everyone has played their 5 cards, 5 new cards are dealt. When the deck is
                empty, the played cards are shuffled into a new deck.
              </li>
              <li>Every pawn starts in its player&apos;s starting zone.</li>
            </RuleList>
          </WornFrame>

          <WornFrame>
            <SectionTitle section={sections.cards} />
            <p className="mt-2 font-body text-sm text-muted-foreground">
              On your turn, play one card and apply its effect.
            </p>

            <div className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
              <CardRule name="Ace" imagePath="/card_heart_1.png">
                Move forward 1 <strong>or</strong> bring a pawn out of the starting zone.
              </CardRule>
              <CardRule name="King" imagePath="/card_spade_13.png">
                Move forward 13 <strong>or</strong> bring a pawn out of the starting zone.
              </CardRule>
              <CardRule name="Queen" imagePath="/card_diamond_12.png">
                Move forward 12.
              </CardRule>
              <CardRule name="Jack" imagePath="/card_clubs_11.png">
                Swap any two pawns on the board <strong>or</strong> move forward 11. Pawns in a
                starting zone or at home cannot be swapped.
              </CardRule>
              <CardRule name="7" imagePath="/card_heart_7.png">
                Use all 7 steps, on one pawn or split between up to four of your pawns. It can
                bring a pawn home. Every opponent pawn you pass over goes back to its starting zone;
                your own pawns are left alone.
              </CardRule>
              <CardRule name="4" imagePath="/card_spade_4.png">
                Move <strong>backward</strong> 4.
              </CardRule>
              <CardRule name="2, 3, 5, 6, 8, 9, 10" imagePath="/card_diamond_5.png">
                Move forward as many cells as the number on the card.
              </CardRule>
            </div>
          </WornFrame>

          <WornFrame>
            <SectionTitle section={sections.moving} />
            <RuleList>
              <li>Only an Ace or a King can bring a pawn out of the starting zone.</li>
              <li>
                Landing on a pawn <strong>knocks it out</strong>: it goes back to its starting
                zone. Even if it is one of your own pawns!
              </li>
              <li>Passing over an opponent pawn does nothing, except with a 7.</li>
              <li>If you only have one pawn on the board, you must move that one.</li>
            </RuleList>
          </WornFrame>

          <WornFrame>
            <SectionTitle section={sections.home} />
            <RuleList>
              <li>
                A pawn enters home only if the move does not go past the last free home cell: the
                last cell, or the cell just before a pawn already inside.
              </li>
              <li>
                If the card is too big, the pawn does not enter: it keeps moving and goes around
                the board once more.
              </li>
              <li>
                A pawn at home can still move forward inside it, as long as it does not go past the
                last free home cell.
              </li>
            </RuleList>
          </WornFrame>

          <WornFrame>
            <SectionTitle section={sections.skipping} />
            <RuleList>
              <li>
                If none of your cards can be played, you <strong>discard one card</strong> and your
                turn ends.
              </li>
              <li>
                For example: no pawn on the board and no Ace or King in your hand, or your only
                pawns are at home and cannot move any further.
              </li>
            </RuleList>
          </WornFrame>

          <WornFrame>
            <SectionTitle section={sections.winning} />
            <RuleList>
              <li>The first player to bring all 4 pawns home wins the game.</li>
            </RuleList>
          </WornFrame>
        </div>
      </div>
    </PageLayout>
  );
}
