# Supervised learning with the SO-101

The [project code](https://github.com/Ehdunhackme/robot-learning/tree/main/projects/so101-path-learning) and this deployment use the same estimators and MuJoCo simulation. Install the root requirements. The two path scorers also need PyTorch with CUDA for training. Run these commands from this directory.

| Tasks | Reproduce the experiment |
| --- | --- |
| Obstacle reach | `python prepare.py --workers 8`, then `python train.py reproduction --recipe shared --width 96 --depth 2 --trace` |
| Shelf inspection | `python shelf_study.py all --workers 8` |
| Handle pickup and peg placement | `python visual_study.py` |

The original path classifiers trained on one 40 GB A100. The [measured reach curve](experiments/shared-risk/reproduction-curve.csv) records training and validation loss. The two pose regressors fit on CPU using simulator pose labels and shape moments from overhead masks. The [paired trials](experiments/visual-pose/results.json) include the fixed-pose control and results at two mask resolutions.

The SO-101 model license is in [assets/so101/LICENSE](assets/so101/LICENSE).
