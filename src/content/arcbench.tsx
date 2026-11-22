import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TrainingCurve } from "./so101-training-curve";
import { Equation } from "./article-equation";
import { ResourceLink } from "@/components/resource-link";
import { Replays } from "./arcbench-interactive";
import styles from "./smollertts.module.css";

export const title = "Teaching an SO-101 arm with supervised learning";
export const description =
  "I trained a simulated SO-101 arm to reach around an obstacle, inspect a shelf and fit a square nut onto a peg.";

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
          I trained a simulated SO-101 arm to reach around an obstacle, inspect
          a shelf and fit a square nut onto a peg. For the first two tasks it
          learns which path to take. For the last one it learns where the nut
          and peg are from an overhead image.{" "}
          <sup><a href="#ref-arm" aria-label="Reference 1">[1]</a></sup>
        </p>
        <Replays />

        <h2 id="training">Starting with a reach</h2>
        <p>
          I started by moving the arm between two points with a fence, a post or
          a bar in the way. On some layouts the gripper cleared the obstacle
          but another part of the arm clipped it. I gave the arm 13 possible
          routes and trained a network to estimate the chance of a collision on each one.
        </p>
        <p>
          MuJoCo checked the whole arm at 81 positions along each route. If any
          position hit the obstacle, the label was 1. A clear route got a 0.
          Running all 13 routes on 4,096 layouts gave me 53,248 labeled paths.
          I trained the network on these labels using binary cross-entropy.
        </p>
        <Equation
          label="Collision classification loss"
          latex={String.raw`\mathcal L=-\frac{1}{N}\sum_{i=1}^{N}\big[y_i\log p_i+(1-y_i)\log(1-p_i)\big]`}
        />
        <p>
          For each path, <var>yᵢ</var> is the simulator label and <var>pᵢ</var>{" "}
          is the model’s predicted probability of a collision. A confident prediction
          that misses a collision gets a large loss.
        </p>
        <h3 id="training-curve">Obstacle reach training curve</h3>
        <TrainingCurve samples={trace} />
        <p>
          Most of the drop came in the first 100 updates. After 1,000 updates,
          training loss was 0.036 and validation loss was 0.072. To choose a
          route, I also wanted to account for how far the joints had to move.
        </p>
        <Equation
          label="Route choice"
          latex={String.raw`r^*=\arg\min_r\left[p_r+(1-p_r)\,\ell_r\right]`}
        />
        <p>
          The arm picks the route with the lowest score. When the predicted
          risk <var>pᵣ</var> is low, the joint travel penalty <var>ℓᵣ</var>{" "}
          favors a shorter movement. I capped that penalty at 0.45.
        </p>
        <h3 id="obstacle-reach-results">Obstacle reach results</h3>
        <p>
          I ran both methods on the same 96 held-out layouts. A reach counted
          if the arm settled within 8 mm of the target without hitting the obstacle.
        </p>
        <div className={styles.tableScroll}>
          <table aria-labelledby="obstacle-reach-results">
            <thead>
              <tr><th scope="col">Method</th><th scope="col">Reached target</th><th scope="col">Hit obstacle</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Direct reach</th><td>18/96 (18.8%)</td><td>78</td></tr>
              <tr><th scope="row">Learned route</th><td>87/96 (90.6%)</td><td>9</td></tr>
            </tbody>
          </table>
        </div>

        <h2 id="reaching">Reaching into a shelf</h2>
        <p>
          The shelf gave the arm less room to turn. It had to reach inside,
          hold the gripper tip within 8 mm of the target for 0.4 seconds, then
          come back out. I added six routes that fold the elbow before the
          gripper goes in and trained a second scorer on shelf layouts.
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
          I compared six versions of the obstacle model on the same validation
          layouts. Sharing one network across the candidate routes brought the
          average cost down from 0.1779 in the first run to 0.1421. For the
          shelf, 48 units per hidden layer worked better on validation than 96.
        </p>

        <p>
          I tested three ways into the shelf. The arm could reach straight in,
          always use the route with the lowest average validation cost, or let the
          model choose for each layout. All three got the same 96 layouts at
          each opening width, following the matched comparisons in MotionBenchMaker.{" "}
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
          Choosing a route for each layout helped at the widest opening. At
          90 mm the fixed route and the learned scorer finished exactly the same
          74 inspections. In the <a href="?task=shelf#replays">shelf replay</a>,
          the moving jaw clears the roof by 0.75 mm.
        </p>

        <h2 id="placement">Fitting the nut onto a peg</h2>
        <p id="grasp">
          For <a href="?task=placement#replays">peg placement</a>, I moved a
          square nut and a matching peg around the bench and varied their angles.
          The arm has to grip the handle, carry the nut over the peg and lower
          it. The square hole leaves just 2 mm of clearance on each side.
          MuJoCo simulates friction between the fingers and the handle.{" "}
          <sup><a href="#ref-contact" aria-label="Reference 2">[2]</a></sup>
        </p>
        <p>
          The camera input was a 96 × 96 image with a silhouette for each part.
          Each silhouette’s center of mass gives a rough position, and the way its
          pixels spread around that center helps recover the angle. I fit separate
          ridge regressions for the nut and peg on CPU using their true positions
          and angles from MuJoCo. I used 1,024 layouts
          for training and 256 to choose the regularization strength.
        </p>
        <Equation label="Supervised pose regression" latex={String.raw`\hat{\mathbf p}=W\,\phi(M)+\mathbf b,\qquad \mathbf p=(x,y,\theta)`} />
        <p>
          The regression maps the image features <var>φ(M)</var> to a position
          and angle. The handle is a known distance from the center of the nut,
          so the controller can work out where to close the jaws. Both arms use
          this same grasp. I changed only where they put the nut down. One aims at
          the average peg pose from training. The other uses the pose predicted
          from the peg’s silhouette.
          A placement counts if the board supports the nut around the peg for
          half a second after the fingers open.
        </p>
        <div className={styles.tableScroll}>
          <table aria-label="Gripper results on 32 held-out layouts">
            <thead><tr><th>Task</th><th>Training-mean pose</th><th>Predicted pose</th><th>Mean XY error of prediction</th></tr></thead>
            <tbody>
              <tr><th scope="row">Peg placement</th><td>2/32</td><td>32/32</td><td>0.22 mm</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          A fixed aim seated only 2 of 32 nuts. Predicting the peg pose seated
          all 32. I repeated the test with 48 × 48 images. Mean peg position
          error went up from 0.22 to 0.61 mm, but all 32 nuts still seated.
          The simulator supplies a clean silhouette from a fixed overhead view.
          For a real arm I’d also need to find the nut and peg when the gripper
          blocks part of the camera image.
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
