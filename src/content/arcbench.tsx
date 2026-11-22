import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TrainingCurve } from "./so101-training-curve";
import { Equation } from "./article-equation";
import { ResourceLink } from "@/components/resource-link";
import { Replays } from "./arcbench-interactive";
import styles from "./smollertts.module.css";

export const title = "Teaching an SO-101 arm with supervised learning";
export const description =
  "I used MuJoCo to label paths and object poses, then trained an SO-101 arm to reach around obstacles, inspect a shelf, pick up a part and seat it on a peg.";

const robot =
  "https://github.com/TheRobotStudio/SO-ARM100/tree/141aea7bcac2744d92998e30268c413202a56f96/Simulation/SO101";
const code =
  "https://github.com/Ehdunhackme/robot-learning/tree/main/projects/so101-path-learning";
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
          <div className={styles.headerBottom}>
            <div className={styles.meta}>
              <time dateTime="2026-11-22">22 Nov 2026</time>
              <span>Dun Li Chan</span>
            </div>
            <nav className={styles.resources} aria-label="Project code">
              <ResourceLink href={code}>GitHub</ResourceLink>
            </nav>
          </div>
        </header>
        <p className={styles.lead}>
          I put a fence between a robot arm and its target. Going straight
          worked on 18 of 96 layouts. Could the arm look at a layout and pick a
          better path before it moved? I used a simulated SO-101 so I could try
          every route, record which ones hit the fence and train on those answers.{" "}
          <sup><a href="#ref-arm" aria-label="Reference 1">[1]</a></sup>
        </p>
        <Replays />

        <h2 id="training">Where the labels came from</h2>
        <p>
          I gave the arm 13 ways to reach the same target. For each layout,
          MuJoCo checked 81 positions along each route. A collision got a 1
          and a clear path got a 0. Across 4,096 layouts that gave me 53,248
          labeled examples. The network takes the layout and a candidate route
          and predicts how likely that route is to hit something.
        </p>
        <h3 id="training-curve">Obstacle reach training curve</h3>
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

        <h2 id="reaching">Does the same idea work inside a shelf?</h2>
        <p>
          Getting around a fence only takes one reach. Inside a shelf the arm
          has to enter, hold its tip within 8 mm of the target for 0.4 seconds,
          then get back out. I trained a second path scorer and added six routes
          that let the elbow fold before the gripper goes in.
        </p>
        <h3>Training the two path scorers</h3>
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

        <p>
          I tested all three controllers on the same 96 layouts at each shelf
          width, following the matched comparisons in MotionBenchMaker. On the
          narrowest opening, always taking the best route from validation tied
          the network. Both finished the same 74 inspections.{" "}
          <sup><a href="#ref-planning" aria-label="Reference 3">[3]</a></sup>
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

        <h2 id="grasp">Where should the fingers close?</h2>
        <p>
          The shelf task came with a target position. For <a href="?task=pickup#replays">Handle pickup</a>,
          I made the arm work that out from an image. Each layout starts with
          a square nut turned a little differently on the bench. The arm has
          to pinch its handle, lift it more than 35 mm and hold it between
          both jaws for the final half second. MuJoCo handles the finger
          contacts and friction.{" "}
          <sup><a href="#ref-contact" aria-label="Reference 2">[2]</a></sup>
        </p>
        <p>
          Open <em>Model input</em> to see the mask the arm uses before it
          moves. I generated a clean overhead silhouette for each layout and
          used its x and y coordinates and rotation from the simulator as labels.
          I trained on 1,024 layouts
          and used another 256 to choose the regularization strength. The image
          center of mass and its shape moments describe where the pixels are
          and how they’re spread out. I fit a ridge regression to those features on CPU.
        </p>
        <Equation label="Supervised pose regression" latex={String.raw`\hat{\mathbf p}=W\,\phi(M)+\mathbf b,\qquad \mathbf p=(x,y,\theta)`} />
        <p>
          Here <var>M</var> is the mask, and <var>φ(M)</var> is its feature
          vector. The model predicts the pose of the part. The controller uses
          the known handle offset to position the jaws, then runs the same
          approach, close and lift sequence for both methods.
        </p>

        <h2 id="placement">Can it put the part back down?</h2>
        <p>
          In <a href="?task=placement#replays">Peg placement</a>, both runs start
          with the same predicted grasp. I changed only where the arm tries to
          put the nut. One controller always aims at the average peg pose from
          training. The other uses a second regressor trained on the peg mask.
          The peg has 2 mm of clearance on each side. I count a placement when
          the nut sits around the peg, supported by the board, for half a
          second after the fingers let go.
        </p>
        <div className={styles.tableScroll}>
          <table aria-label="Gripper results on 32 held-out layouts">
            <thead><tr><th>Task</th><th>Training-mean pose</th><th>Predicted pose</th><th>Mean XY error of prediction</th></tr></thead>
            <tbody>
              <tr><th scope="row">Handle pickup</th><td>24/32</td><td>32/32</td><td>0.15 mm</td></tr>
              <tr><th scope="row">Peg placement</th><td>2/32</td><td>32/32</td><td>0.22 mm</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          A rough guess was often close enough for the jaws to catch the handle.
          It rarely lined up the square hole with the peg. I halved the mask
          width from 96 to 48 pixels and repeated the same 32 layouts. Mean peg
          position error rose from 0.22 to 0.61 mm, and all 32 parts still
          seated. These were clean silhouettes from a fixed overhead view.
          A real camera would also have to find the part with the arm in view.
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
            <li id="ref-contact">
              <p>
                MuJoCo.{" "}
                <a href="https://mujoco.readthedocs.io/en/stable/modeling.html#contact-parameters">
                  Contact parameters
                </a>
                . How friction and contact settings work when the fingers meet
                the handle and the nut settles on the board.
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
  title = {Teaching an {SO-101} arm with supervised learning},
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
