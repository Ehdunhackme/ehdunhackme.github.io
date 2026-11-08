import Link from "next/link";
import Image from "next/image";
import { Directory } from "@/components/directory";
export function WritingsContent() {
  return (
    <Directory
      kind="writings"
      heading={
        <header className={"card-page-heading"}>
          {" "}
          <div>
            <h1 className={"editorial-heading"}>{"Writings."}</h1>
            <p className={"page-intro"}>
              {"Some reflections I've picked up along the journey."}
            </p>
          </div>{" "}
        </header>
      }
      groups={[
        {
          id: "writing-results",
          entries: [
            {
              id: "writing-midterms-2026",
              searchText:
                "2026 US Midterm Election Model House Senate polling elections statistics elastic net five models historical validation uncertainty 8 Nov 2026",
              content: (
                <Link
                  className="writing-section-link"
                  href="/writings/2026-us-midterm-election-model/"
                >
                  <span>
                    <span className="writing-section-title">
                      2026 US Midterm Election Model
                    </span>
                    <span className="writing-section-description">
                      Training on multiple election cycles, comparing five
                      models, and estimating vote shares with uncertainty.
                    </span>
                  </span>
                  <span className="writing-section-side">
                    <time className="writing-date" dateTime="2026-11-08">
                      8 Nov 2026
                    </time>
                    <span className="writing-section-arrow" aria-hidden="true">
                      ↗︎
                    </span>
                  </span>
                </Link>
              ),
            },
            {
              id: "writing-0",
              searchText:
                "My opinionated guide to starting research early An opinionated guide for high schoolers in Malaysia who want to work on cool research projects early. 19 Sep 2026 ↗︎",
              content: (
                <Link
                  className={"writing-section-link"}
                  href={
                    "/writings/my-opinionated-guide-to-starting-research-early/"
                  }
                >
                  {" "}
                  <span>
                    {" "}
                    <span className={"writing-section-title"}>
                      {"My opinionated guide to starting research early"}
                    </span>{" "}
                    <span className={"writing-section-description"}>
                      {
                        "An opinionated guide for high schoolers in Malaysia who want to work on cool research projects early."
                      }
                    </span>{" "}
                  </span>{" "}
                  <span className={"writing-section-side"}>
                    {" "}
                    <time className={"writing-date"} dateTime={"2026-09-19"}>
                      {"19 Sep 2026"}
                    </time>{" "}
                    <span
                      className={"writing-section-arrow"}
                      aria-hidden={"true"}
                    >
                      {"↗︎"}
                    </span>{" "}
                  </span>{" "}
                </Link>
              ),
            },
          ],
        },
      ]}
    />
  );
}
