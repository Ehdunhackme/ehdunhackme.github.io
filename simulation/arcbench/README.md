# Training the SO-101 path controllers

These are the scripts and frozen models behind the [SO-101 article](https://dunlichan.com/writings/so101-path-learning/). Use a fresh checkout to reproduce a study. The shelf and puck scripts write their results into the corresponding experiment directory.

Install the repository's root `requirements.txt`. For the neural path models, also install PyTorch with CUDA support for your GPU. Run the commands below from this directory.

| Task | Generate labels and train |
| --- | --- |
| Obstacle reach | `python prepare.py --workers 8`, then `python train.py reproduction --recipe shared --width 96 --depth 2` |
| Shelf inspection | `python shelf_study.py all --workers 8` |
| Puck push | `python puck_study.py --workers 8` |

The original reach and shelf networks trained on a single 40 GB NVIDIA A100. The puck study runs on CPU. Its selector stores the cost of every simulated action and picks the neighbor count using held-out validation layouts. The article reports the archived evaluation. Fresh contact simulations can produce different puck endpoints across platforms.

The original [six obstacle-reach validation runs](experiments/results.tsv) include the rejected trial. The SO-101 model license is in [assets/so101/LICENSE](assets/so101/LICENSE).

## Reproduce the training curve and gripper pilot

After generating the reach labels, run `python train.py traced --recipe shared --width 96 --depth 2 --trace` in a fresh copy and plot `experiments/traced/curve.csv` with `python plot_training_curve.py experiments/traced/curve.csv reach.svg` (Matplotlib). The [measured trace](experiments/shared-risk/reproduction-curve.csv) records full train and validation BCE every 25 updates on an A100. All saved parameter arrays matched the archived checkpoint.

Run `python assembly_study.py` for the square-nut pilot. It uses two rigid jaw-mounted contact pads, a free object and a scripted waypoint controller. The corrected approach has access to the exact stationary peg position. Both gripping conditions pick up from the known initial nut pose. The [192 paired-condition rollouts](experiments/assembly/pilot.json) use the same 32 seeds for two clearances and three controllers, including jaws held open. Results are from the Windows simulation.
