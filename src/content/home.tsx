import Link from "next/link";
import { LegacyHomeAnchors } from "@/components/legacy-home-anchors";
export function HomeContent() {
  return (
    <main className="profile home-profile">
      <LegacyHomeAnchors />

      <>
        {" "}
        <section
          className={"home-introduction about"}
          id={"about"}
          aria-label={"Introduction"}
        >
          {" "}
          <h1 className="intro-greeting" id="profile-title">
            Hi! I’m Dun Li.
          </h1>{" "}
          <p className="intro-current">
            {
              "I’m currently an R&D engineer building frontier video diffusion infra at "
            }
            <a
              className={"about-org"}
              href={"https://www.trychert.com/"}
              target={"_blank"}
              rel={"noopener"}
            >
              <img
                src={"/assets/logos/chert-square.webp"}
                width={"16"}
                height={"16"}
                alt={""}
                loading="lazy"
              />
              {"Chert (YC P26)"}
            </a>
            {", working on robotics manipulation via RSI at "}
            <a
              className={"about-org"}
              href={"https://www.tsinghua.edu.cn/en/"}
              target={"_blank"}
              rel={"noopener"}
            >
              <img
                src={"/assets/logos/tsinghua-square.webp"}
                alt={""}
                loading="lazy"
                width={16}
                height={16}
              />
              {"Tsinghua"}
            </a>
            {", WAM interp at "}
            <a
              className={"about-org"}
              href={"https://eleuther.ai/soar/"}
              target={"_blank"}
              rel={"noopener"}
            >
              <img
                className={"logo-eleutherai"}
                src={"/assets/logos/eleutherai-square.webp"}
                alt={""}
                loading="lazy"
                width={16}
                height={16}
              />
              {"EleutherAI"}
            </a>
            {", and post-training eval and optimisation at "}
            <a
              className={"about-org"}
              href={"https://universetbd.org/"}
              target={"_blank"}
              rel={"noopener"}
            >
              <img
                src={"/assets/logos/universetbd-square.webp"}
                alt={""}
                loading="lazy"
                width={16}
                height={16}
              />
              {"UniverseTBD"}
            </a>
            {"."}
          </p>{" "}
          <p>
            {"Growing up in Malaysia, my "}
            <Link href="/about/#more-about-me" className="journey-link">
              {"journey"}
            </Link>
            {
              " began at 10 with hacking games and jailbreaking phones. I'm currently working in physical AI & post-training optimisation, with "
            }
            <Link href={"/projects/"}>{"publications"}</Link>
            {" at NeurIPS, AACL, and EACL."}
          </p>{" "}
          <p className={"intro-highlights-lead"}>{"Previously, I:"}</p>{" "}
          <ul className={"intro-highlights"}>
            {" "}
            <li>
              {"Represented Malaysia at the "}
              <a
                href={"https://ioaastrophysics.org/"}
                target={"_blank"}
                rel={"noopener"}
              >
                {"Intl. Olympiad of Astronomy & Astrophysics (IOAA)"}
              </a>
              {" and "}
              <a
                href={"http://www.issp.ac.ru/iao/2025/"}
                target={"_blank"}
                rel={"noopener"}
              >
                {"Intl. Astronomy Olympiad (IAO)"}
              </a>
              {"."}
            </li>{" "}
            <li>
              {"Founded "}
              <a
                href={"https://myresearchguide.org/"}
                target={"_blank"}
                rel={"noopener"}
              >
                {"MYResearchGuide"}
              </a>
              {" and the "}
              <a
                href={"https://myssp.myresearchguide.org/"}
                target={"_blank"}
                rel={"noopener"}
              >
                {"Malaysia Science Scholar’s Programme"}
              </a>
              {" to make research opportunities more accessible."}
            </li>{" "}
            <li>
              {"Did research at "}
              <a
                className={"about-org"}
                href={"https://en.sjtu.edu.cn/"}
                target={"_blank"}
                rel={"noopener"}
              >
                <img
                  className={"logo-sjtu"}
                  src={"/assets/logos/sjtu-square.webp"}
                  alt={""}
                  loading="lazy"
                  width={16}
                  height={16}
                />
                {"Shanghai Jiao Tong Uni."}
              </a>
              {", the "}
              <a
                className={"about-org"}
                href={"https://www.umd.edu/"}
                target={"_blank"}
                rel={"noopener"}
              >
                <img
                  className={"logo-maryland"}
                  src={"/assets/logos/maryland-square.webp"}
                  alt={""}
                  loading="lazy"
                  width={16}
                  height={16}
                />
                {"Uni. of Maryland"}
              </a>
              {", "}
              <a
                className={"about-org"}
                href={"https://metacreation.net/"}
                target={"_blank"}
                rel={"noopener"}
              >
                <img
                  className={"logo-metacreation"}
                  src={"/assets/logos/metacreation-square.webp"}
                  alt={""}
                  loading="lazy"
                  width={16}
                  height={16}
                />
                {"Metacreation Lab"}
              </a>
              {", and "}
              <a
                className={"about-org"}
                href={"https://seacrowd.github.io/"}
                target={"_blank"}
                rel={"noopener"}
              >
                <img
                  src={"/assets/logos/seacrowd-square.webp"}
                  alt={""}
                  loading="lazy"
                  width={16}
                  height={16}
                />
                {"SEACrowd"}
              </a>
              {"."}
            </li>{" "}
          </ul>{" "}
        </section>{" "}
      </>

      <nav className={"social-links"} aria-label={"External links"}>
        {" "}
        <a href={"mailto:dunlinmy88@gmail.com"}>{"Email"}</a>{" "}
        <a
          href={
            "https://docs.google.com/document/d/1GGPG1R-ieZixVmeLvklmSXJkOLpN7ZH7Nxp0hMCjDuc/edit?usp=sharing"
          }
          target={"_blank"}
          rel={"noopener"}
        >
          {"Resume"}
        </a>{" "}
        <a
          href={"https://www.linkedin.com/in/dun-li-chan-6b3095269/"}
          target={"_blank"}
          rel={"noopener"}
        >
          {"LinkedIn"}
        </a>{" "}
        <a
          href={"https://github.com/ehdunhackme"}
          target={"_blank"}
          rel={"noopener"}
        >
          {"GitHub"}
        </a>{" "}
        <a
          href={"https://scholar.google.com/citations?user=UOYqiG4AAAAJ"}
          target={"_blank"}
          rel={"noopener"}
        >
          {"Google Scholar"}
        </a>{" "}
        <a
          href={"https://x.com/dunlichan"}
          target={"_blank"}
          rel={"noopener"}
          aria-label={"X profile"}
        >
          {"X"}
        </a>{" "}
        <a
          href={"https://calendly.com/dunlinmy88/30min"}
          target={"_blank"}
          rel={"noopener"}
        >
          {"Book a Call"}
        </a>{" "}
      </nav>
    </main>
  );
}
