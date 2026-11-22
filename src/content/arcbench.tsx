import { Equation } from "./article-equation";
import { ResourceLink } from "@/components/resource-link";
import { ArticleDisclosure } from "./article-disclosure";
import { PushPaths, Replays, SurfaceTrials } from "./arcbench-interactive";
import styles from "./smollertts.module.css";

export const title = "Robot path learning with an SO-101 arm";
export const description =
  "I trained a simulated SO-101 to pick a path around a fence, then tried a shelf and a puck. You can move things around and try all three tasks here.";
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
              <ResourceLink href="#training">Training</ResourceLink>
              <ResourceLink href={trialData} kind="document" download>
                Trial data
              </ResourceLink>
              <ResourceLink href={robot}>Arm model</ResourceLink>
            </nav>
          </div>
        </header>
        <p className={styles.lead}>
          I wanted to see if I could teach a robot arm to pick its own path. So I put
          a fence between an SO-101 and the spot I wanted it to reach. If I move
          the fence, can the arm still get there? Try it in the simulator below.
        </p>
        <Replays />

        <h2 id="reaching">Around a fence and into a shelf</h2>
        <p>
          I started by moving each joint from its starting angle to its final angle.
          On paper that puts the gripper right on the target. In the simulator
          the arm hit something on 78 of the 96 test layouts.
        </p>
        <p>
          I wrote 13 possible routes between the same two poses. What the model
          learned was which one to pick when I moved the obstacle. It got to the
          target on 87 of those 96 layouts. The direct route only managed 18.
        </p>
        <p>
          Then I put the target inside a shelf. Try the shelf replay and pause it
          at about three seconds. The direct route has already hit the right wall.
          On the learned route, the arm lines up with the opening first. Watch the
          moving jaw as it goes in. At its closest it clears the roof by 0.75 mm
          in MuJoCo. I haven’t tried that on a real arm.
        </p>
        <ArticleDisclosure
          className={styles.disclosure}
          summary="How much did learning help on the shelf?"
        >
          <p>
            I added six routes that let the arm fold up before it enters the shelf.
            I tried the same 96 layouts at each opening width. To count as a success,
            the gripper had to stay within 8 mm of the target for 0.4 seconds, then
            get back out and return home without hitting anything.
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
            The 90 mm opening is the one I’d look at. With the original 13 routes,
            only three layouts had a clear way in. Once I added the six new routes,
            I could pick one on the validation set and use it every time. That one
            route finished exactly the same 74 layouts as the learned model. A lot
            of the gain here came from giving the arm a better way into the shelf.
          </p>
        </ArticleDisclosure>

        <h2 id="training">How I trained the arm to choose a path</h2>
        <p>
          I used supervised learning for the reach and shelf tasks. I didn’t use
          reinforcement learning (RL) or direct preference optimization (DPO).
          I could try every path in MuJoCo and check whether the arm hit anything,
          so I already had an answer to train on for each one.
        </p>
        <p>
          I used three kinds of obstacles for the reach task. Depending on the
          layout, the arm had to get past a low fence, a tall post or an overhead
          block. I checked 81 positions along each of the 13 paths. Across
          4,096 training layouts that gave me 53,248 paths labeled
          clear or collision. I trained a network to predict the chance of a
          collision using this loss.
        </p>
        <Equation label="Collision classification loss" latex={String.raw`\mathcal L=-\frac{1}{N}\sum_{i=1}^{N}\big[y_i\log p_i+(1-y_i)\log(1-p_i)\big]`} />
        <p>
          <var>yᵢ</var> is 1 if the arm hits something on path <var>i</var>.{" "}
          <var>pᵢ</var> is how likely the model thinks that is. If it gives a path
          a 1% chance of collision and the arm hits the fence, it gets a big penalty.
          But suppose two paths both look safe. I’d still want the arm to take the
          shorter one.
        </p>
        <Equation label="Route choice" latex={String.raw`r^*=\arg\min_r\left[p_r+(1-p_r)\,\ell_r\right]`} />
        <p>
          That’s what <var>ℓᵣ</var> does. It measures how much extra joint travel
          a route takes. The direct route gets a penalty of zero and the longest
          detours can get up to 0.45. A collision costs 1. The controller picks the
          path with the lowest estimated cost, then the servos follow it.
        </p>
        <ArticleDisclosure className={styles.disclosure} summary="Training settings and model selection">
          <div className={styles.tableScroll}><table aria-label="Path model training settings">
            <thead><tr><th>Setting</th><th>Obstacle reach</th><th>Shelf inspection</th></tr></thead>
            <tbody>
              <tr><th scope="row">Candidate routes</th><td>13</td><td>19</td></tr>
              <tr><th scope="row">Train / validation layouts</th><td>4,096 / 640</td><td>1,600 / 240</td></tr>
              <tr><th scope="row">Selected network</th><td>2 × 96 hidden units, ReLU</td><td>2 × 48 hidden units, ReLU</td></tr>
              <tr><th scope="row">AdamW learning rate</th><td>0.002</td><td>0.0015</td></tr>
              <tr><th scope="row">Updates × batch size</th><td>1,000 × 256 layouts</td><td>1,100 × 128 layouts</td></tr>
              <tr><th scope="row">GPU</th><td colSpan={2}>One NVIDIA A100, 40 GB</td></tr>
            </tbody>
          </table></div>
          <p>
            I tried six versions of the reach model on the same validation layouts.
            The first one got an average cost of 0.1779. The best one used the same
            network to score each possible route and got that down to 0.1421. For
            the shelf I tried 48 and 96 units per hidden layer. The smaller network
            did better on validation.
          </p>
          <p><a href="https://github.com/Ehdunhackme/ehdunhackme.github.io/tree/main/simulation/arcbench">Training code, commands and trial log</a></p>
        </ArticleDisclosure>

        <h2 id="pushing">What changes when the arm has to push?</h2>
        <p>
          I wanted a harder task where the arm had to move something else as well.
          I put a little paddle on its wrist and gave it a 40 g puck to push
          into a circle. The arm can finish its move exactly where I told it
          to and the puck can still slide right past the target.
        </p>
        <p>
          I let the arm change one thing about the push. It always comes up behind
          the puck, but the end of the stroke can move left or right in 12 mm steps,
          up to 36 mm either way. Try −24 mm and +24 mm in the figure. Same puck,
          same target 60 mm away. One push stops about 5 mm from the center and
          the other misses by 37 mm.
        </p>
        <PushPaths />

        <h2 id="learning">How the arm picks a push</h2>
        <p>
          For the puck I used nearest neighbors. I tried all seven pushes on each
          of 192 layouts, so I had 1,344 examples of where the puck actually
          ended up. I scored each push by how far it missed the target in
          millimeters, capped that at 100, and added another 100 if the arm collided
          with the bench, the pad or itself.
        </p>
        <Equation label="Puck training cost, in millimeters" latex={String.raw`c_i(a)=\min(e_i(a),100)+100\,\mathbf{1}_{\mathrm{collision}}`} />
        <p>
          When the arm sees a new layout, it looks up similar ones from training.
          I used four numbers for that lookup. Two tell me where the puck starts
          on the pad, one tells me which direction the target is in, and one tells
          me how far away it is. I scaled them before comparing layouts. For each
          push I take a weighted average of the earlier costs, giving the closest
          layouts more say. The arm picks one stroke before the paddle touches the puck.
        </p>
        <Equation label="Nearest-neighbor push selection" latex={String.raw`\begin{aligned}
          w_i&=\frac{1}{\lVert x-x_i\rVert_2^2+0.01},\\
          a^*&=\arg\min_a\frac{\sum_{i\in N_3(x)}w_i\,c_i(a)}{\sum_{i\in N_3(x)}w_i}.
        \end{aligned}`} />
        <p>
          Why three neighbors in the equation? I tried different counts on 48
          validation layouts and three gave me the lowest average cost. I used
          those same layouts to pick one push to use every time as a comparison.
          The best fixed choice was to push straight.
        </p>
        <p>
          I tested both on the same 64 new layouts. The learned controller got{" "}
          <strong>45 out of 64</strong> pucks on target. Pushing straight got 18.
          The average distance from the target went from 20.1 mm to 12.0 mm. There were also
          three layouts where pushing straight worked and the learned push missed.
        </p>

        <h2 id="surface">What if I change the surface?</h2>
        <p>
          All the training pushes were on the same surface. What happens if I make
          the pad more slippery? I took the same 64 layouts and had both controllers
          repeat the exact strokes they’d already picked. The only thing I changed
          was the sliding friction between the puck and the pad.
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
          On the slippery pad the model went from 45 successes to 32. If you just
          look at the average error, it barely moves, from 12.0 to 12.5 mm. I used
          a 10 mm cutoff for success, so a puck that stops 11 mm from the center
          goes in the same column as one that misses by 40 mm.
        </p>
        <ArticleDisclosure
          className={styles.disclosure}
          summary="Scoring and trial data"
        >
          <p>
            I measured from the center of the puck, which has a 20 mm radius. To
            count, the arm had to touch the puck and leave it within 10 mm of the
            target center, moving slower than 5 mm/s. Hitting the bench, the pad
            or the arm itself also ended the run. MuJoCo advanced 2 ms at a time.
          </p>
          <p>
            Two controllers, 64 layouts and three surfaces gave me 384 runs. When
            I set the friction back to 0.48, I got the original outcome and final
            error on every layout, down to the precision I’d saved.{" "}
            <a href={trialData} download>Download the per-run CSV.</a>
          </p>
          <p>
            I recorded the clips and plots on Windows. Custom layouts run on the
            site’s Linux server. I tried the same seed and the same 69 mm push on
            both. The puck started in the same spot, but it finished 7.10 mm from
            the target on my machine and 21.03 mm away on the server.
          </p>
        </ArticleDisclosure>

        <h2 id="next">Two pushes through a gate</h2>
        <p>
          Next I’d try a 60 mm gate with the target off to one side behind it.
          The puck is 40 mm across, so even dead center it only has 10 mm to
          spare on each side. I’d set it up so a straight push towards the target
          hits a post. The arm would have to push the puck through the gate,
          come around it and push again.
        </p>
        <p>
          What I want to know is whether it helps to look again between pushes.
          I’d have one controller start its second push from where it expected
          the puck to stop. The other gets to see where the puck actually stopped.
          I’d score getting through the gate, clipping a post and reaching the target
          separately. The run I’d want to watch is one where the first push goes
          a bit sideways. Can the arm still save it on the second?
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
                <a href={robot}>SO-101 follower simulation model</a>. I used the geometry and
                actuator settings from this model.
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
                I borrowed the idea of testing different planners on the same
                generated layouts for the shelf experiment.
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
  title = {Robot path learning with an {SO-101} arm},
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
