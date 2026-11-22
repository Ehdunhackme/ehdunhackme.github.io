# Training the SO-101 path controllers

These are the scripts and frozen models behind the [Arcbench article](https://dunlichan.com/writings/arcbench/). Use a fresh checkout to reproduce a study. The shelf and puck scripts write their results into the corresponding experiment directory.

Install the repository's root `requirements.txt`. For the neural path models, also install PyTorch with CUDA support for your GPU. Run the commands below from this directory.

| Task | Generate labels and train |
| --- | --- |
| Obstacle reach | `python prepare.py --workers 8`, then `python train.py reproduction --recipe shared --width 96 --depth 2` |
| Shelf inspection | `python shelf_study.py all --workers 8` |
| Puck push | `python puck_study.py --workers 8` |

The original reach and shelf networks trained on a single 40 GB NVIDIA A100. The puck study runs on CPU. Its selector stores the cost of every simulated action and picks the neighbor count using held-out validation layouts. The article reports the archived evaluation. Fresh contact simulations can produce different puck endpoints across platforms.

The original [six obstacle-reach validation runs](experiments/results.tsv) include the rejected trial. The SO-101 model license is in [assets/so101/LICENSE](assets/so101/LICENSE).
