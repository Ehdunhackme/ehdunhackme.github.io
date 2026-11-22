import { Equation } from "./article-equation";
import { PushPaths, Replays, SurfaceTrials } from "./arcbench-interactive";
import styles from "./smollertts.module.css";

export const title = "Robot path learning with an SO-101 arm";
export const description =
  "I trained a simulated SO-101 to pick a route, then tested what it takes to grip a square nut and fit it onto a peg. Try the arm and see the training curve.";

export function ArcbenchArticle() {
  return (
    <main className="page writing-page">
      <article className={`page-shell writing-post-shell writing-content ${styles.article}`}>
        <header className={styles.header}>
          <h1>{title}</h1>
          <div className={styles.meta}><time dateTime="2026-11-22">22 Nov 2026</time><span>Dun Li Chan</span></div>
        </header>
        <p className={styles.lead}>
          I started by teaching the arm to find a way around a fence. Then I
          realised it could do the whole task with its jaws open. So I gave
          it a square nut to pick up and a peg to fit it onto. Try the
          same run with the jaws held open and watch what happens.
        </p>
        <Replays />

        <h2 id="assembly">Getting the nut onto the peg</h2>
        <p>
          The arm has to pinch the handle, lift the nut over the peg, turn it
          to match the square opening, then let go. I only count a run if both
          jaws grip the nut, it lifts at least 35 mm, and it stays seated for
          half a second after release. The finger pads hold the handle through friction in MuJoCo. The nut can slip out.
        </p>
        <p>
          I scripted the gripper motions for this first test. I gave the arm
          a peg position that was off by 5 mm. One controller used that estimate
          all the way down. The other got the exact peg position from the simulator
          for its final approach. I ran both on the same 32 layouts, changing
          where the nut and peg started and which way they faced.
        </p>
        <div className={styles.tableScroll}>
          <table aria-label="Nuts seated and released on 32 layouts">
            <thead><tr><th>Clearance per side</th><th>Initial estimate</th><th>Recheck peg</th><th>Jaws open</th></tr></thead>
            <tbody>
              <tr><th scope="row">3 mm</th><td>29/32</td><td>32/32</td><td>0/32</td></tr>
              <tr><th scope="row">1 mm</th><td>5/32</td><td>32/32</td><td>0/32</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          At 1 mm, both gripping controllers still lifted all 32 nuts. The
          difference showed up when they tried to put them down. The next
          thing I’d try is estimating the peg position from a camera. Right
          now the recheck gets a measurement that a real arm wouldn’t have.
        </p>

        <h2 id="training">How the arm learned to choose a path</h2>
        <p>
          For the obstacle task I wrote 13 routes and trained a network to
          predict which ones would hit something. I checked 81 positions
          along each route in MuJoCo. That gave me 53,248 labeled paths from
          4,096 layouts. I used supervised learning for this, so I didn’t
          need reinforcement learning or DPO.
        </p>
        <h3 id="training-curve">Training curve</h3>
        <figure style={{margin: "1.5rem 0"}}>
          <img src="/assets/writings/arcbench/training-curve.svg" width={620} height={325}
            style={{display:"block", width:"100%", height:"auto", borderRadius:6}}
            alt="Reach classifier loss over 1,000 updates. Training loss falls from 0.704 to 0.036 and validation loss from 0.704 to 0.072." />
          <figcaption>
            I reran the reach model on one 40 GB A100 and logged binary
            cross-entropy on the full training set and 640 validation layouts
            every 25 updates. The final weights matched the original run exactly.
          </figcaption>
        </figure>
        <p>
          The curve drops fastest in the first 100 updates. By update 1,000
          the loss was 0.036 on training layouts and 0.072 on layouts the
          model hadn’t trained on. To turn a collision prediction into a
          route, I gave a collision a cost of 1 and a clear route a small
          penalty for extra joint travel.
        </p>
        <Equation label="Route choice" latex={String.raw`r^*=\arg\min_r\left[p_r+(1-p_r)\,\ell_r\right]`} />
        <p>
          Here <var>pᵣ</var> is the predicted chance of a collision and{" "}
          <var>ℓᵣ</var> is the travel penalty, capped at 0.45. On 96 new
          layouts, the arm reached the target <strong>87 times</strong> using
          this rule. Going straight worked 18 times.
        </p>

        <h2 id="reaching">What helped on the shelf?</h2>
        <p>
          I added six routes that let the arm fold up before reaching inside.
          On the 90 mm opening, the learned controller finished 74 of 96
          inspections. Picking one route on the validation set and using it
          every time finished the exact same 74. Giving the arm a better way
          in mattered more here than how it picked the route.
        </p>

        <h2 id="pushing">What worked for the puck?</h2>
        <p>
          I tried seven paddle offsets on each of 192 layouts. For a new push,
          the arm looks up the three most similar training layouts and picks
          the stroke with the lowest average cost, giving closer matches
          more weight. Try −24 mm and +24 mm below. On this layout, one push
          stops about 5 mm from the center and the other misses by 37 mm.
        </p>
        <PushPaths />
        <p id="surface">
          On the training surface, the learned push landed inside the target
          on <strong>45 of 64 new layouts</strong>. Pushing straight got 18.
          When I made the pad more slippery and repeated the same strokes,
          the learned controller dropped to 32. The target only allows 10 mm
          of error, so even a small change in where the puck stops can cost a run.
        </p>
        <SurfaceTrials />
        <p className={styles.note}>
          The scores and clips come from the recorded simulations. A seed
          reproduces the layout, but contact outcomes can vary across
          machines. On one 69 mm push the puck missed by 7.10 mm on Windows
          and 21.03 mm on the site’s Linux server.
        </p>

        <h2>Code and sources</h2>
        <ul>
          <li><a href="https://github.com/Ehdunhackme/ehdunhackme.github.io/tree/main/simulation/arcbench">Training code, gripper task and recorded results</a></li>
          <li><a href="https://github.com/TheRobotStudio/SO-ARM100/tree/141aea7bcac2744d92998e30268c413202a56f96/Simulation/SO101">The SO-101 arm model</a></li>
          <li>I adapted the square nut task from <a href="https://robosuite.ai/docs/modules/environments#nut-assembly">robosuite’s nut assembly benchmark</a>.</li>
        </ul>
      </article>
    </main>
  );
}
