import { ResourceLink } from "@/components/resource-link";
import { ArticleDisclosure } from "./article-disclosure";
import { PushPaths, Replays, SurfaceTrials } from "./arcbench-interactive";
import styles from "./smollertts.module.css";

export const title = "Teaching an SO-101 arm where to push";
export const description =
  "I built Arcbench to compare ways of moving a simulated robot arm. Try the replays, then see what happens when the puck slides differently.";
const trialData = "/assets/writings/arcbench/puck-trials.csv";
const robot =
  "https://github.com/TheRobotStudio/SO-ARM100/tree/141aea7bcac2744d92998e30268c413202a56f96/Simulation/SO101";

export function ArcbenchArticle() {
  return (
    <main className="page writing-page">
      <article
        className={`page-shell writing-post-shell writing-content ${styles.article}`}
      >
        <header className={styles.header}>
          <h1>{title}</h1>
          <div className={styles.headerBottom}>
            <div className={styles.meta}>
              <time dateTime="2026-11-22">22 Nov 2026</time>
              <span>Dun Li Chan</span>
            </div>
            <nav className={styles.resources} aria-label="Arcbench resources">
              <ResourceLink href="#replays">Replays</ResourceLink>
              <ResourceLink href={trialData} kind="document" download>
                Trial data
              </ResourceLink>
              <ResourceLink href={robot}>Arm model</ResourceLink>
            </nav>
          </div>
        </header>
        <p className={styles.lead}>
          I gave a simulated SO-101 arm a blue puck and a target 60 mm away. A
          straight push left the puck 12.5 mm from the center, just outside the
          10 mm tolerance. Moving the end of the paddle stroke 24 mm to one side
          brought the error down to 4.6 mm. You can watch both pushes below.
        </p>
        <Replays />

        <h2 id="reaching">Getting the wrist through the shelf</h2>
        <p>
          I started Arcbench with a simpler question. If the gripper can reach a
          point, can the rest of the arm get there too? I put a fence between
          two poses and drove the joints from one pose to the other. The target
          was reachable. The arm hit the fence on the way.
        </p>
        <p>
          I gave the controller 13 possible routes and trained it to weigh
          collision risk against extra joint travel. On 96 held-out obstacle
          layouts, the selected route reached the target 87 times. A direct
          reach made it 18 times. Then I put the target inside a shelf. A route
          that got the gripper past the side wall could still catch the moving
          jaw on the roof.
        </p>
        <p>
          The shelf replay shows the difference at about three seconds. The
          direct reach has already hit the right wall. The other route lines up
          with the opening before entering. At its closest recorded pass, the
          simulated jaw clears the roof by 0.75 mm. That measurement comes from
          the model’s collision surfaces. I haven’t tried that clearance on a
          physical arm.
        </p>
        <ArticleDisclosure
          className={styles.disclosure}
          summary="How much did learning help on the shelf?"
        >
          <p>
            I added six routes that fold and align the arm at the shelf mouth.
            Each controller faced the same 96 layouts at each width. To finish,
            the arm had to hold within 8 mm of the inspection point for 0.4
            seconds and return home without contact.
          </p>
          <div className={styles.tableScroll}>
            <table aria-label="Completed shelf inspections out of 96">
              <thead>
                <tr>
                  <th>Opening</th>
                  <th>Direct reach</th>
                  <th>Best fixed route</th>
                  <th>Learned route</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [180, 0, 75, 81],
                  [125, 0, 75, 73],
                  [90, 0, 74, 74],
                ].map(([w, d, f, l]) => (
                  <tr key={w}>
                    <th scope="row">{w} mm</th>
                    <td>{d}/96</td>
                    <td>{f}/96</td>
                    <td>{l}/96</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            At 90 mm, only three layouts had a clear inward path among the
            original 13. With the extra routes, a single route chosen on
            validation finished exactly the same 74 layouts as the learned
            controller. Giving the arm a better way into the shelf accounted for
            most of the improvement.
          </p>
        </ArticleDisclosure>

        <h2 id="pushing">Letting contact do the work</h2>
        <p>
          In the shelf task, touching something ends the run. For the puck,
          contact is how the arm gets anything done. I attached a small paddle
          to the wrist and let MuJoCo handle what happened after it touched the
          40 g puck. The puck could slide, turn, or keep moving after the paddle
          came away.
        </p>
        <p>
          I kept the decision small. The arm approaches from behind the puck,
          pushes, then lifts. It can finish its stroke at one of seven sideways
          offsets, from −36 to +36 mm in 12 mm steps. The figure follows the
          puck’s center for all seven actions in the opening layout. Try +24 mm
          after −24 mm. The two offsets have the same size, but one misses by
          more than 37 mm.
        </p>
        <PushPaths />

        <h2 id="learning">Choosing a push from earlier runs</h2>
        <p>
          I ran all seven pushes on each of 192 training layouts. For a new
          layout, the controller looks up earlier ones with similar starting
          positions, push directions and distances. It gives closer matches more
          weight and picks the action with the lowest estimated cost. That cost
          uses the puck’s final error, capped at 100 mm, plus a penalty for an
          arm collision. It commits to one stroke before touching the puck.
        </p>
        <p>
          I used 48 separate layouts to choose how many neighbors to consult.
          Three worked best. I also used validation to choose the best single
          offset for a controller that always makes the same push. It chose
          zero, so the straight push was also the strongest fixed baseline under
          that selection rule.
        </p>
        <p>
          On 64 new layouts, the learned selector finished{" "}
          <strong>45 pushes inside the target</strong>. The straight push
          finished 18. The average final error went from 20.1 to 12.0 mm. Three
          layouts went the other way and succeeded only with the straight push.
        </p>

        <h2 id="surface">Changing the surface under the puck</h2>
        <p>
          The controller learned all of that on one surface. I wanted to know
          what would happen if the positions looked familiar but the puck slid
          differently. I kept the trained selector, the 64 layouts and both
          controllers’ chosen strokes fixed. I reran them with lower and higher
          sliding friction between the puck and the pad.
        </p>
        <SurfaceTrials />
        <div className={styles.tableScroll}>
          <table aria-label="Puck results across sliding friction settings">
            <thead>
              <tr>
                <th>Sliding friction</th>
                <th>Learned successes</th>
                <th>Straight successes</th>
                <th>Learned mean error</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">0.16</th>
                <td>32/64</td>
                <td>15/64</td>
                <td>12.5 mm</td>
              </tr>
              <tr>
                <th scope="row">0.48 (training)</th>
                <td>45/64</td>
                <td>18/64</td>
                <td>12.0 mm</td>
              </tr>
              <tr>
                <th scope="row">0.80</th>
                <td>39/64</td>
                <td>18/64</td>
                <td>14.6 mm</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The slippery surface cost the learned controller 13 successes even
          though its average error rose by only half a millimeter. The two
          measures answer different questions. A puck that stops 11 mm from the
          target counts as a miss just as surely as one that stops 40 mm away.
        </p>
        <ArticleDisclosure
          className={styles.disclosure}
          summary="Scoring and trial data"
        >
          <p>
            The puck has a 20 mm radius. I scored its center after the paddle
            withdrew. A success required arm-to-puck contact, a final error of
            at most 10 mm, puck translation below 5 mm/s, and no arm collision
            with the bench, pad or itself. The solver advanced in 2 ms steps.
          </p>
          <p>
            The three friction settings give 384 controller runs. The 0.48 rerun
            reproduced every stored outcome and endpoint error to the recorded
            precision. The paired layouts measure how this particular controller
            responds to a changed surface in simulation.{" "}
            <a href={trialData} download>
              Download the per-run CSV.
            </a>
          </p>
        </ArticleDisclosure>

        <h2 id="next">Two pushes through a gate</h2>
        <p>
          The harder task I’d try next is to put a 60 mm gate in front of this
          40 mm puck and place the target off to one side behind it. That leaves
          10 mm of clearance per side on a centered pass. I’d choose layouts
          where a straight line to the target intersects a post, so the arm has
          to push through the opening, come around the puck, then push in a new
          direction.
        </p>
        <p>
          The interesting decision is where to begin that second push. One
          controller could use the puck position it expected after the first
          stroke. Another could look at where the puck actually stopped and plan
          from there. I’d score gate crossings, post contacts and final
          placements separately. That would tell me whether an error starts at
          the gate or when the arm tries to recover. This is the next experiment
          I’d run.
        </p>

        <section
          className={styles.references}
          aria-labelledby="arcbench-references"
        >
          <h2 id="arcbench-references">References</h2>
          <ol className={styles.referenceList}>
            <li>
              <p>
                TheRobotStudio.{" "}
                <a href={robot}>SO-101 follower simulation model</a>. The robot
                geometry and actuator definitions used in Arcbench.
              </p>
            </li>
            <li>
              <p>
                MuJoCo.{" "}
                <a href="https://mujoco.readthedocs.io/en/stable/modeling.html#contact-parameters">
                  Contact parameters
                </a>
                . How the simulator combines friction and other contact
                settings.
              </p>
            </li>
            <li>
              <p>
                Constantinos Chamzas and colleagues.{" "}
                <a href="https://arxiv.org/abs/2112.06402">MotionBenchMaker</a>.
                I used the same idea of comparing planners on shared,
                procedurally varied scenes for the shelf study.
              </p>
            </li>
          </ol>
        </section>
        <section
          className={styles.citation}
          aria-labelledby="arcbench-citation"
        >
          <h2 id="arcbench-citation">Cite this post</h2>
          <pre>
            <code>{`@misc{chan2026arcbench,
  title = {Teaching an {SO-101} arm where to push},
  author = {Chan, Dun Li},
  year = {2026},
  month = {nov},
  url = {https://dunlichan.com/writings/arcbench/}
}`}</code>
          </pre>
        </section>
      </article>
    </main>
  );
}
