import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TrainingCurve } from "./so101-training-curve";
import { Equation } from "./article-equation";
import { PushPaths, Replays, SurfaceTrials } from "./arcbench-interactive";
import styles from "./smollertts.module.css";

export const title = "Robot path learning with an SO-101 arm";
export const description =
  "I trained a simulated SO-101 to pick a route, then tested what it takes to grip a square nut and fit it onto a peg. Try the arm and see the training curve.";

const robot =
  "https://github.com/TheRobotStudio/SO-ARM100/tree/141aea7bcac2744d92998e30268c413202a56f96/Simulation/SO101";
const code =
  "https://github.com/Ehdunhackme/ehdunhackme.github.io/tree/main/simulation/arcbench";
const trace = readFileSync(
  join(
    process.cwd(),
    "simulation/arcbench/experiments/shared-risk/reproduction-curve.csv",
  ),
  "utf8",
)
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [update, training, validation] = line.split(",").map(Number);
    return { update, training, validation };
  });

export function ArcbenchArticle() {
  return (
    <main className="page writing-page">
      <article
        className={`page-shell writing-post-shell writing-content ${styles.article}`}
      >
        <header className={styles.header}>
          <h1>{title}</h1>
          <div className={styles.meta}>
            <time dateTime="2026-11-22">22 Nov 2026</time>
            <span>Dun Li Chan</span>
          </div>
        </header>
        <p className={styles.lead}>
          I started by teaching the arm to find a way around a fence. Then I
          realised it could do the whole task with its jaws open. So I gave it a
          square nut to pick up and a peg to fit it onto. Try the same run with
          the jaws held open and watch what happens.
        </p>
        <Replays />

        <h2 id="assembly">Getting the nut onto the peg</h2>
        <p>
          The arm has to pinch the handle, lift the nut over the peg, turn it to
          match the square opening, then let go. I only count a run if both jaws
          grip the nut, it lifts at least 35 mm, and it stays seated for half a
          second after release. I used the SO-101 follower model for the arm and
          adapted the square nut task from robosuite. The nut stays in the
          fingers through friction in MuJoCo, so it can slip out.{" "}
          <sup>
            <a href="#ref-arm" aria-label="Reference 1">
              [1]
            </a>
            ,{" "}
            <a href="#ref-robosuite" aria-label="Reference 2">
              [2]
            </a>
            ,{" "}
            <a href="#ref-contact" aria-label="Reference 3">
              [3]
            </a>
          </sup>
        </p>
        <p>
          I scripted the gripper motions for this first test. I gave the arm a
          peg position that was off by 5 mm. One controller used that estimate
          all the way down. The other got the exact peg position from the
          simulator for its final approach. I ran both on the same 32 layouts,
          changing where the nut and peg started and which way they faced.
        </p>
        <div className={styles.tableScroll}>
          <table aria-label="Nuts seated and released on 32 layouts">
            <thead>
              <tr>
                <th>Clearance per side</th>
                <th>Initial estimate</th>
                <th>Recheck peg</th>
                <th>Jaws open</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">3 mm</th>
                <td>29/32</td>
                <td>32/32</td>
                <td>0/32</td>
              </tr>
              <tr>
                <th scope="row">1 mm</th>
                <td>5/32</td>
                <td>32/32</td>
                <td>0/32</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          At 1 mm, both gripping controllers still lifted all 32 nuts. The
          difference showed up when they tried to put them down. The next thing
          I’d try is estimating the peg position from a camera. Right now the
          recheck gets a measurement that a real arm wouldn’t have.
        </p>

        <h2 id="training">How the arm learned to choose a path</h2>
        <p>
          For the obstacle task I wrote 13 routes and trained a network to
          predict which ones would hit something. I checked 81 positions along
          each route in MuJoCo. That gave me 53,248 labeled paths from 4,096
          layouts. I used supervised learning for this, so I didn’t need
          reinforcement learning or DPO.
        </p>
        <h3 id="training-curve">Training curve</h3>
        <TrainingCurve samples={trace} />
        <p>
          The curve drops fastest in the first 100 updates. By update 1,000 the
          loss was 0.036 on training layouts and 0.072 on layouts the model
          hadn’t trained on. That loss measures how well the network predicts a
          collision. Here’s what I actually trained it to minimise.
        </p>
        <Equation
          label="Collision classification loss"
          latex={String.raw`\mathcal L=-\frac{1}{N}\sum_{i=1}^{N}\big[y_i\log p_i+(1-y_i)\log(1-p_i)\big]`}
        />
        <p>
          <var>yᵢ</var> is 1 if the arm hits something on path <var>i</var>.{" "}
          <var>pᵢ</var> is how likely the model thinks that is. If it gives a
          path a 1% chance of collision and the arm hits the fence, it gets a
          big penalty. But suppose two paths both look safe. I’d still want the
          arm to take the shorter one.
        </p>
        <Equation
          label="Route choice"
          latex={String.raw`r^*=\arg\min_r\left[p_r+(1-p_r)\,\ell_r\right]`}
        />
        <p>
          Here <var>pᵣ</var> is the predicted chance of a collision and{" "}
          <var>ℓᵣ</var> is the travel penalty, capped at 0.45. On 96 new
          layouts, the arm reached the target <strong>87 times</strong> using
          this rule. Going straight worked 18 times.
        </p>

        <h3>Training settings</h3>
        <div className={styles.tableScroll}>
          <table aria-label="Path model training settings">
            <thead>
              <tr>
                <th>Setting</th>
                <th>Obstacle reach</th>
                <th>Shelf inspection</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Candidate routes</th>
                <td>13</td>
                <td>19</td>
              </tr>
              <tr>
                <th scope="row">Train / validation layouts</th>
                <td>4,096 / 640</td>
                <td>1,600 / 240</td>
              </tr>
              <tr>
                <th scope="row">Selected network</th>
                <td>2 × 96 hidden units, ReLU</td>
                <td>2 × 48 hidden units, ReLU</td>
              </tr>
              <tr>
                <th scope="row">AdamW learning rate</th>
                <td>0.002</td>
                <td>0.0015</td>
              </tr>
              <tr>
                <th scope="row">Updates × batch size</th>
                <td>1,000 × 256 layouts</td>
                <td>1,100 × 128 layouts</td>
              </tr>
              <tr>
                <th scope="row">GPU</th>
                <td colSpan={2}>One NVIDIA A100, 40 GB</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          I tried six versions of the reach model on the same validation
          layouts. The first one got an average cost of 0.1779. The best one
          used the same network to score each possible route and got that down
          to 0.1421. For the shelf I tried 48 and 96 units per hidden layer. The
          smaller network did better on validation.
        </p>

        <h2 id="reaching">What helped on the shelf?</h2>
        <p>
          For this task the gripper had to hold within 8 mm of a target inside
          the shelf for 0.4 seconds and get back out without a collision. I ran
          each controller on the same 96 layouts at every opening width,
          following the comparison approach in MotionBenchMaker.{" "}
          <sup>
            <a href="#ref-planning" aria-label="Reference 4">
              [4]
            </a>
          </sup>
        </p>
        <p>
          I added six routes that let the arm fold up before reaching inside. On
          the 90 mm opening, the learned controller finished 74 of 96
          inspections. Picking one route on the validation set and using it
          every time finished the exact same 74. Giving the arm a better way in
          mattered more here than how it picked the route.
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
          In the shelf replay, pause at about three seconds and try the “Shelf
          opening” camera. The straight reach has already hit the wall. The
          learned route brings the moving jaw past the roof with 0.75 mm to
          spare in this simulation.
        </p>

        <h2 id="pushing">What worked for the puck?</h2>
        <p>
          I put a paddle on the wrist and gave the arm a 40 g puck. It always
          starts from behind the puck, but I can move the end of its stroke to
          either side. Try −24 mm and +24 mm below. On this layout, one push
          stops about 5 mm from the center and the other misses by 37 mm.
        </p>
        <PushPaths />
        <h2 id="learning">How the arm picks a push</h2>
        <p>
          For the puck I used nearest neighbors. I tried all seven pushes on
          each of 192 layouts, so I had 1,344 examples of where the puck
          actually ended up. I scored each push by how far it missed the target
          in millimeters, capped that at 100, and added another 100 if the arm
          collided with the bench, the pad or itself.
        </p>
        <Equation
          label="Puck training cost, in millimeters"
          latex={String.raw`c_i(a)=\min(e_i(a),100)+100\,\mathbf{1}_{\mathrm{collision}}`}
        />
        <p>
          When the arm sees a new layout, it looks up similar ones from
          training. I used four numbers for that lookup. Two tell me where the
          puck starts on the pad, one tells me which direction the target is in,
          and one tells me how far away it is. I scaled them before comparing
          layouts. For each push I take a weighted average of the earlier costs,
          giving the closest layouts more say. The arm picks one stroke before
          the paddle touches the puck.
        </p>
        <Equation
          label="Nearest-neighbor push selection"
          latex={String.raw`\begin{aligned}
          w_i&=\frac{1}{\lVert x-x_i\rVert_2^2+0.01},\\
          a^*&=\arg\min_a\frac{\sum_{i\in N_3(x)}w_i\,c_i(a)}{\sum_{i\in N_3(x)}w_i}.
        \end{aligned}`}
        />
        <p>
          Why three neighbors in the equation? I tried different counts on 48
          validation layouts and three gave me the lowest average cost. I used
          those same layouts to pick one push to use every time as a comparison.
          The best fixed choice was to push straight.
        </p>
        <p>
          I tested both on the same 64 new layouts. The learned controller got{" "}
          <strong>45 out of 64</strong> pucks on target. Pushing straight got
          18. The average distance from the target went from 20.1 mm to 12.0 mm.
          There were also three layouts where pushing straight worked and the
          learned push missed.
        </p>

        <h2 id="surface">What if I change the surface?</h2>
        <p>
          All the training pushes were on the same surface. What happens if I
          make the pad more slippery? I took the same 64 layouts and had both
          controllers repeat the exact strokes they’d already picked. The only
          thing I changed was the sliding friction between the puck and the pad.
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
          On the slippery pad the model went from 45 successes to 32. If you
          just look at the average error, it barely moves, from 12.0 to 12.5 mm.
          I used a 10 mm cutoff for success, so a puck that stops 11 mm from the
          center goes in the same column as one that misses by 40 mm.
        </p>
        <p className={styles.note}>
          The scores and clips come from the recorded simulations. A seed
          reproduces the layout, but contact outcomes can vary across machines.
          On one 69 mm push the puck missed by 7.10 mm on Windows and 21.03 mm
          on the site’s Linux server.
        </p>

        <h2 id="next">The next thing I’d try</h2>
        <p>
          I’d put a gate between the puck and its target. With a 40 mm puck and
          a 60 mm gate, there’s only 10 mm to spare on either side. I’d move the
          target off to one side so the arm has to push through the gate, come
          around the puck and push again. If the first push lands a little wide,
          can it recover on the second? For the nut, I’d run the same 1 mm test
          using a camera estimate and see how close it gets to the
          exact-position result.
        </p>
        <p className={styles.sourceLinks}>
          <a href={code}>Simulation, training code and recorded results</a>
        </p>

        <section className={styles.references} aria-labelledby="references">
          <h2 id="references">References</h2>
          <ol className={styles.referenceList}>
            <li id="ref-arm">
              <p>
                TheRobotStudio.{" "}
                <a href={robot}>SO-101 follower simulation model</a>. I used its
                arm geometry and actuator settings.
              </p>
            </li>
            <li id="ref-robosuite">
              <p>
                robosuite.{" "}
                <a href="https://robosuite.ai/docs/modules/environments#nut-assembly">
                  Nut Assembly
                </a>
                . The square nut and peg inspired the gripper task.
              </p>
            </li>
            <li id="ref-contact">
              <p>
                MuJoCo.{" "}
                <a href="https://mujoco.readthedocs.io/en/stable/modeling.html#contact-parameters">
                  Contact parameters
                </a>
                . How friction and contact settings work when the fingers meet
                the handle or the puck slides across the pad.
              </p>
            </li>
            <li id="ref-planning">
              <p>
                Constantinos Chamzas and colleagues.{" "}
                <a href="https://arxiv.org/abs/2112.06402">
                  MotionBenchMaker: A Tool to Generate and Benchmark Motion
                  Planning Datasets
                </a>
                . I used the idea of comparing planners on matched layouts.
              </p>
            </li>
          </ol>
        </section>
        <section className={styles.citation} aria-labelledby="citation">
          <h2 id="citation">Cite this post</h2>
          <pre>
            <code>{`@misc{chan2026so101paths,
  title = {Robot path learning with an {SO-101} arm},
  author = {Chan, Dun Li},
  year = {2026},
  month = {nov},
  url = {https://dunlichan.com/writings/so101-path-learning/}
}`}</code>
          </pre>
        </section>
      </article>
    </main>
  );
}
