import Link from "next/link";
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
                "Modelling the 2026 US Midterm Elections House Senate polling elections statistics benchmark 13 models poll baseline blend all 50 states historical validation uncertainty 8 Nov 2026",
              content: (
                <Link
                  className="writing-section-link"
                  href="/writings/2026-us-midterm-election-model/"
                >
                  <span className="writing-year" aria-hidden="true">
                    2026
                  </span>
                  <span className="writing-entry-content">
                    <span className="writing-section-title">
                      Modelling the 2026 US Midterm Elections
                    </span>
                    <span className="writing-section-description">
                      Comparing 13 models on past elections, then estimating all
                      435 House districts and 35 Senate contests.
                    </span>
                  </span>
                  <span className="writing-section-side">
                    <time className="writing-date" dateTime="2026-11-08">
                      <span className="writing-date-full">8 Nov 2026</span>
                      <span className="writing-date-short" aria-hidden="true">
                        11/08
                      </span>
                    </time>
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
                  <span className="writing-year" aria-hidden="true">
                    2026
                  </span>
                  <span className="writing-entry-content">
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
                      <span className="writing-date-full">19 Sep 2026</span>
                      <span className="writing-date-short" aria-hidden="true">
                        09/19
                      </span>
                    </time>{" "}
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
