"""Publication figures and responsive website variants."""

import textwrap
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.ticker import MaxNLocator
import numpy as np
from scipy import stats


class Figures:
    def __init__(self, out, root, dark=False, mobile=False):
        self.out, self.dark, self.mobile = (out, dark, mobile)
        self.bg = "#1a1a1a" if dark else "#ffffff"
        self.ink = "#e6e6e6" if dark else "#282828"
        self.muted = "#aaa9a6" if dark else "#686868"
        self.grid = "#373737" if dark else "#e7e7e5"
        self.neutral = "#8d8d8a" if dark else "#a6a6a1"
        self.blue = "#8ab4ff" if dark else "#346c9c"
        self.red = "#df9b88" if dark else "#b45941"
        self.font = 12 if mobile else 10.5
        font_manager.fontManager.addfont(root / "assets/fonts/Geist-Regular.ttf")
        plt.rcParams.update(
            {
                "font.family": "Geist",
                "font.size": self.font,
                "text.color": self.ink,
                "axes.labelcolor": self.muted,
                "xtick.color": self.muted,
                "ytick.color": self.ink,
                "axes.facecolor": self.bg,
                "figure.facecolor": self.bg,
                "savefig.facecolor": self.bg,
                "axes.spines.top": False,
                "axes.spines.right": False,
                "axes.spines.left": False,
                "axes.spines.bottom": False,
                "svg.fonttype": "path",
            }
        )

    def canvas(self, title, subtitle, panels=1, panel_height=3.2):
        rows = panels if self.mobile else 1
        cols = 1 if self.mobile else panels
        height = rows * panel_height + 1.3
        fig, axes = plt.subplots(
            rows, cols, figsize=(5.2 if self.mobile else 10.4, height), squeeze=False
        )
        top = 1 - 0.95 / height
        fig.subplots_adjust(
            left=0.115 if self.mobile else 0.09,
            right=0.92,
            top=top,
            bottom=0.55 / height,
            hspace=0.52,
            wspace=0.3,
        )
        heading = textwrap.fill(title, 42 if self.mobile else 95)
        fig.text(0.025, 1 - 0.08 / height, heading, va="top", fontsize=15 if self.mobile else 17)
        header_lines = heading.count("\n") + 1
        sub = textwrap.fill(subtitle, 53 if self.mobile else 110)
        fig.text(
            0.025,
            1 - (0.08 + header_lines * 0.24 + 0.08) / height,
            sub,
            va="top",
            fontsize=10.8,
            color=self.muted,
        )
        return (fig, list(axes.flat))

    def clean(self, ax, axis="x"):
        ax.tick_params(length=0, pad=7)
        ax.set_axisbelow(True)
        ax.grid(axis=axis, color=self.grid, linewidth=0.65)
        ax.xaxis.set_major_locator(MaxNLocator(5 if self.mobile else 6))

    def save(self, fig, slug):
        if self.dark:
            folder = self.out / "web"
            folder.mkdir(exist_ok=True)
            fig.savefig(
                folder / f"{slug}{('-mobile' if self.mobile else '')}.svg",
                bbox_inches="tight",
                pad_inches=0.06,
            )
        else:
            fig.savefig(self.out / f"{slug}.svg", bbox_inches="tight", pad_inches=0.06)
            fig.savefig(self.out / f"{slug}.png", dpi=180, bbox_inches="tight", pad_inches=0.06)
        plt.close(fig)

    def training(self, history):
        counts = (
            history.groupby(["cycle", "chamber"]).size().unstack().reindex(range(2000, 2025, 2))
        )
        fig, (ax,) = self.canvas(
            "Historical data across election years",
            "D/R races available for the model comparison",
            panel_height=3.7 if self.mobile else 3.5,
        )
        if self.mobile:
            y = np.arange(len(counts))
            ax.barh(y - 0.17, counts.house, height=0.3, color=self.blue, label="House")
            ax.barh(y + 0.17, counts.senate, height=0.3, color=self.neutral, label="Senate")
            ax.set_yticks(y, counts.index)
            ax.invert_yaxis()
            ax.set_xlabel("Races")
        else:
            x = np.arange(len(counts))
            ax.bar(x - 0.17, counts.house, width=0.3, color=self.blue, label="House")
            ax.bar(x + 0.17, counts.senate, width=0.3, color=self.neutral, label="Senate")
            ax.set_xticks(x, counts.index)
            ax.set_ylabel("Races")
        # Give the legend its own line between the subtitle and the data.
        height = fig.get_figheight()
        fig.subplots_adjust(top=1 - (1.35 if self.mobile else 1.15) / height)
        handles, labels = ax.get_legend_handles_labels()
        fig.legend(
            handles,
            labels,
            frameon=False,
            loc="upper left",
            bbox_to_anchor=(0.025, 1 - (0.85 if self.mobile else 0.65) / height),
            borderaxespad=0,
            ncol=2,
            fontsize=10,
            handlelength=1.6,
            columnspacing=1.6,
        )
        self.clean(ax, "x" if self.mobile else "y")
        if not self.mobile:
            ax.set_xticks(np.arange(len(counts)), counts.index)
        self.save(fig, "01-training-years")

    def validation(self, predictions, close=False):
        rows = predictions[predictions.cycle >= 2014]
        title = (
            "Where the close-race predictions land"
            if close
            else "Historical predictions against election results"
        )
        fig, axes = self.canvas(
            title, "Each election is predicted using earlier years only", 2, 3.5
        )
        for ax, chamber in zip(axes, ["house", "senate"]):
            all_rows = rows[rows.chamber.eq(chamber)]
            g = all_rows[all_rows.baseline_prediction.between(45, 55)] if close else all_rows
            correct = (g.prediction > 50) == (g.dem_share > 50)
            ax.scatter(
                g.loc[correct, "prediction"],
                g.loc[correct, "dem_share"],
                s=17,
                color=self.neutral,
                alpha=0.75,
                linewidth=0,
            )
            ax.scatter(
                g.loc[~correct, "prediction"],
                g.loc[~correct, "dem_share"],
                s=25,
                facecolors="none",
                edgecolors=self.red,
                linewidth=0.9,
            )
            low = np.floor(min(g.dem_share.min(), g.prediction.min()) / 5) * 5
            high = np.ceil(max(g.dem_share.max(), g.prediction.max()) / 5) * 5
            ax.plot([low, high], [low, high], color=self.muted, lw=0.9, linestyle=(0, (3, 3)))
            ax.axhline(50, color=self.grid, lw=1)
            ax.axvline(50, color=self.grid, lw=1)
            ax.set_xlim(low, high)
            ax.set_ylim(low, high)
            ax.set_xlabel("Predicted D vote share (%)")
            ax.set_ylabel("Actual D vote share (%)")
            rmse = np.sqrt(np.mean((g.dem_share - g.prediction) ** 2))
            ax.set_title(
                f"{chamber.title()}   {len(g)} races / RMSE {rmse:.2f}",
                loc="left",
                fontsize=self.font,
                pad=14,
            )
            self.clean(ax, "both")
        self.save(fig, "03-close-races" if close else "02-historical-validation")

    def diagnostics(self, predictions):
        rows = predictions[predictions.cycle >= 2014].copy()
        rows["error"] = rows.dem_share - rows.prediction
        fig, axes = self.canvas(
            "Inspecting the errors",
            "Historical validation residuals; actual minus predicted vote share",
            4 if self.mobile else 2,
            3.1 if self.mobile else 6.1,
        )
        if not self.mobile:
            for ax in axes:
                ax.remove()
            axes = list(fig.subplots(2, 2).flat)
            fig.subplots_adjust(
                left=0.09, right=0.96, top=0.86, bottom=0.08, hspace=0.5, wspace=0.25
            )
        for i, chamber in enumerate(["house", "senate"]):
            g = rows[rows.chamber.eq(chamber)]
            ax = axes[i * 2]
            ax.scatter(g.prediction, g.error, s=16, color=self.neutral, alpha=0.7, lw=0)
            ax.axhline(0, color=self.muted, lw=0.8, linestyle=(0, (3, 3)))
            ax.set_title(f"{chamber.title()} / residuals", loc="left", fontsize=self.font)
            ax.set_xlabel("Predicted D share (%)")
            ax.set_ylabel("Error (pp)")
            self.clean(ax, "y")
            (x, y), (slope, intercept, _) = stats.probplot(g.error)
            ax = axes[i * 2 + 1]
            ax.scatter(x, y, s=16, color=self.neutral, alpha=0.8, lw=0)
            ax.plot(x, intercept + slope * x, color=self.blue, lw=1)
            ax.set_title(f"{chamber.title()} / normal Q–Q", loc="left", fontsize=self.font)
            ax.set_xlabel("Normal quantile")
            ax.set_ylabel("Observed error (pp)")
            self.clean(ax, "y")
        self.save(fig, "10-residual-diagnostics")
