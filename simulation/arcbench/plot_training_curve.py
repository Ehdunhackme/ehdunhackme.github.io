"""Render the measured reach-classifier loss trace as a standalone figure."""

import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np


def plot(csv_path, output):
    rows = np.genfromtxt(csv_path, delimiter=",", names=True)
    with plt.rc_context(
        {"font.size": 12, "svg.fonttype": "none", "svg.hashsalt": "reach-bce"}
    ):
        bg, ink, grid = "#202122", "#e6e7e8", "#454648"
        fig, ax = plt.subplots(figsize=(6.2, 3.25), layout="constrained")
        fig.patch.set_facecolor(bg)
        ax.set_facecolor(bg)
        ax.plot(
            rows["update"], rows["train_bce"], color="#84baf7", lw=2.2, label="Training"
        )
        ax.plot(
            rows["update"],
            rows["validation_bce"],
            color="#f4b384",
            lw=2.2,
            linestyle="--",
            label="Validation",
        )
        ax.set(
            xlim=(0, 1000),
            ylim=(0, 0.76),
            xticks=[0, 250, 500, 750, 1000],
            yticks=[0, 0.2, 0.4, 0.6],
            xlabel="Optimizer update",
            ylabel="Collision loss (BCE)",
        )
        ax.grid(axis="y", color=grid, linewidth=0.7)
        ax.set_axisbelow(True)
        for key in ("top", "right"):
            ax.spines[key].set_visible(False)
        for key in ("left", "bottom"):
            ax.spines[key].set_color(grid)
        ax.tick_params(colors=ink)
        ax.xaxis.label.set_color(ink)
        ax.yaxis.label.set_color(ink)
        ax.legend(loc="upper right", frameon=False, labelcolor=ink)
        fig.savefig(output, facecolor=bg, metadata={"Date": None})
        plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plot(args.source, args.output)
