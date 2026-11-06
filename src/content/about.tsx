import Link from "next/link";
import { Gallery } from "@/components/gallery";
import { FocusScope } from "@/components/focus-scope";
import { AboutSections } from "@/components/about-sections";
export function AboutContent() {
  return (
    <AboutSections
      panels={[
        {
          id: "more-about-me",
          label: "My journey timeline",
          headingId: "journey-heading",
          content: (
            <>
              {" "}
              <h2 id={"journey-heading"}>{"My journey timeline"}</h2>{" "}
              <div className={"timeline-panel"}>
                {" "}
                <FocusScope className={"timeline"} selector=".timeline-item">
                  {" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"Present"}</time>
                    <div className={"timeline-entry"}>
                      <h3>{"Exploring Physical AI & AI safety"}</h3>
                      <ul>
                        <li>
                          {
                            "Currently working on RSI for robotics manipulation at "
                          }
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
                          {
                            ", World Action Model (WAM) interpretability research at "
                          }
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
                          {
                            ", and building video diffusion models for human-AI interaction at "
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
                          {
                            ". I'm also working on some side projects in robotics/model optimisation, and post-training eval & mech interpretability research at "
                          }
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
                        </li>
                      </ul>
                    </div>
                  </article>{" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"2026 - Present"}</time>
                    <div className={"timeline-entry"}>
                      <h3>
                        {"Expanding Malaysian Youth Access to Science Research"}
                      </h3>
                      <ul>
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
                            {"Malaysia Science Scholar's Programme"}
                          </a>
                          {
                            ", nonprofit initiatives helping Malaysian youth discover and access science research opportunities. Supported by 40+ researchers from leading universities such as MIT, Harvard, Stanford, and Oxbridge, as well as frontier industry labs such as Meta AI and YC-backed startups."
                          }
                        </li>
                        <li>
                          {
                            "Raised $2K in funding, received 300+ applications, and scaled nationally within 10 months, with sponsorship from companies and institutions including MathWorks, the company behind MATLAB."
                          }
                        </li>
                      </ul>
                    </div>
                  </article>{" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"2024 - Present"}</time>
                    <div className={"timeline-entry"}>
                      {" "}
                      <h3>{"AI research"}</h3>{" "}
                      <ul>
                        <li>
                          {
                            "Since 2024, I’ve worked on multiple AI research projects across mechanistic interpretability, NLP, and AI4Astro. I’ve also published multiple papers at leading AI conferences, including NeurIPS and ACL conferences (check my "
                          }
                          <Link href={"/projects/"}>{"Projects section"}</Link>
                          {" for details)."}
                        </li>
                      </ul>{" "}
                    </div>
                  </article>{" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"2025"}</time>
                    <div className={"timeline-entry"}>
                      <h3>{"Olympiads & STEM outreach"}</h3>
                      <ul>
                        <li>
                          {"Placed "}
                          <a
                            href={"https://www.facebook.com/mystarfinder/posts/moaa-2025congrats-to-the-top-5-students-of-moaa-camp-2025-your-hard-work-truly-s/1281241123527267/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"3rd"}
                          </a>
                          {" and "}
                          <a
                            href={"https://drive.google.com/file/d/106pV0jfTmrnT4CiBOoi6WdF19nrSgeyX/view?usp=sharing"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"2nd"}
                          </a>
                          {
                            " in Malaysia Astronomy Olympiad selection rounds, represented Malaysia in IOAA and IAO, and now help as a problem setter for the national team selection."
                          }
                        </li>
                        <li>
                          {"Founded "}
                          <a
                            href={"https://www.instagram.com/olyprep.io/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"olyprep.io"}
                          </a>
                          {
                            ", an olympiad tutoring platform run through Discord servers, growing it to $10K USD MRR within 2 months of launch with 50+ students."
                          }
                        </li>
                        <li>
                          {"Volunteer with "}
                          <a
                            href={"https://amiso.my/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"AMISO"}
                          </a>
                          {" as a committee member, co-directed "}
                          <a
                            href={"https://amiso.my/ysec/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"Youth STEM Experimentation Camp 2025"}
                          </a>
                          {
                            " (a 2-day MOE-approved nationwide competition with 500+ sign-ups), wrote astronomy questions for "
                          }
                          <a
                            href={"https://amiso.my/ysc/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"Youth STEM Cup 2026"}
                          </a>
                          {
                            ", and handled website maintenance as Technical Executive."
                          }
                        </li>
                        <li>
                          {
                            "Served as a bootcamp instructor for the USA Astronomy Olympiad under "
                          }
                          <a
                            href={"https://pandorax.org/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"Pandorax"}
                          </a>
                          {"."}
                        </li>
                        <li>
                          {
                            "Served as a board member and wrote astrophysics questions for the "
                          }
                          <a
                            href={"https://www.nzphysicscup.com/home"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"New Zealand Physics Cup"}
                          </a>
                          {" and "}
                          <a
                            href={"https://www.ricesciencebowl.com/"}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"Rice University Science Bowl"}
                          </a>
                          {"."}
                        </li>
                      </ul>
                      <a
                        className={"timeline-post-link"}
                        href={
                          "https://www.facebook.com/mystarfinder/posts/the-malaysian-team-has-finished-their-journey-at-ioaa-2025-in-mumbai-indiain-a-p/1382836000034445/"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Malaysia in IOAA [Post]"}
                      </a>
                      <span aria-hidden={"true"}>{" · "}</span>
                      <a
                        className={"timeline-post-link"}
                        href={
                          "https://drive.google.com/drive/folders/1VA47VbQYPoikfB4cbAvDxOGh4vz2bv14?usp=sharing"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Some olympiad handouts/slides I made for teaching"}
                      </a>
                      <Gallery
                        label={"Olympiads gallery"}
                        items={[
                          {
                            src: "/assets/gallery/thumbs/olympiads-malaysia-departure.webp",
                            full: "/assets/gallery/olympiads-malaysia-departure.webp",
                            alt: "Malaysia delegation at the airport",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-myao-team.webp",
                            full: "/assets/gallery/olympiads-myao-team.webp",
                            alt: "Malaysia Astronomy Olympiad team holding the Malaysian flag",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-team.webp",
                            full: "/assets/gallery/olympiads-team.webp",
                            alt: "Olympiad team on a staircase",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-selfie.webp",
                            full: "/assets/gallery/olympiads-selfie.webp",
                            alt: "Olympiad team selfie",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-certificate.webp",
                            full: "/assets/gallery/olympiads-certificate.webp",
                            alt: "IOAA certificate",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-night-observing.webp",
                            full: "/assets/gallery/olympiads-night-observing.webp",
                            alt: "Night observing session",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-telescope.webp",
                            full: "/assets/gallery/olympiads-telescope.webp",
                            alt: "Students setting up a telescope",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-moaa-team.webp",
                            full: "/assets/gallery/olympiads-moaa-team.webp",
                            alt: "Malaysia Astronomy Olympiad team with certificates",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-games.webp",
                            full: "/assets/gallery/olympiads-games.webp",
                            alt: "Olympiad students playing games",
                          },
                          {
                            src: "/assets/gallery/thumbs/ysec-group-photo.webp",
                            full: "/assets/gallery/ysec-group-photo.webp",
                            alt: "Youth STEM Experimentation Camp group photo",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-lab-group.webp",
                            full: "/assets/gallery/olympiads-lab-group.webp",
                            alt: "Olympiad students and mentors in a physics laboratory",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-observatory-telescope.webp",
                            full: "/assets/gallery/olympiads-observatory-telescope.webp",
                            alt: "Students observing through a telescope at an observatory",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-optics-lab.webp",
                            full: "/assets/gallery/olympiads-optics-lab.webp",
                            alt: "Optics experiment setup in a laboratory",
                          },
                          {
                            src: "/assets/gallery/thumbs/olympiads-night-team-selfie.webp",
                            full: "/assets/gallery/olympiads-night-team-selfie.webp",
                            alt: "Olympiad students taking a night-time group selfie",
                          },
                        ]}
                      />
                    </div>
                  </article>{" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"2023–2024"}</time>
                    <div className={"timeline-entry"}>
                      <h3>{"Biochemistry research"}</h3>
                      <ul>
                        <li>
                          {
                            "Was part of my secondary school's science research team (under Universiti Sains Malaysia), where I developed a nanopesticide from biowaste materials to eradicate red flour beetles ("
                          }
                          <a
                            href={
                              "https://drive.google.com/file/d/1Pxt9b19rViTJb3E08PNuuuw7LjDcir1u/view?usp=sharing"
                            }
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"Project abstract"}
                          </a>
                          {
                            ") and competed in the Malaysia ISEF national selection finals (Top 25)."
                          }
                        </li>
                        <li>
                          {
                            "2x represented my secondary school as a delegate (2023, 2024) in "
                          }
                          <em>
                            {"Science and Technology Symposium for Youths"}
                          </em>
                          {
                            " (STSY), a joint symposium hosted annually by my school and top schools from Asia; presented my research at the "
                          }
                          <a
                            href={
                              "https://mp.weixin.qq.com/s/koQULGjG_EFGKDeSVxVBnQ"
                            }
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {
                              "High School Affiliated to Xi'an Jiaotong University"
                            }
                          </a>
                          {"."}
                        </li>
                        <li>
                          {"Coached two junior teams, one of which won a "}
                          <a
                            href={
                              "https://www.moe.gov.my/syabas-paskan-inovasi-negara"
                            }
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"4th place grand award at ISEF"}
                          </a>
                          {"."}
                        </li>
                      </ul>
                      <Gallery
                        label={"Biochemistry research gallery"}
                        items={[
                          {
                            src: "/assets/gallery/thumbs/biochem-nreoc-team.webp",
                            full: "/assets/gallery/biochem-nreoc-team.webp",
                            alt: "N-ReoC research poster with student researchers",
                          },
                          {
                            src: "/assets/gallery/thumbs/biochem-stsy-team-photo.webp",
                            full: "/assets/gallery/biochem-stsy-team-photo.webp",
                            alt: "Science and Technology Symposium for Youths student delegates on stage",
                          },
                          {
                            src: "/assets/gallery/thumbs/stsy-2023-awards.webp",
                            full: "/assets/gallery/stsy-2023-awards.webp",
                            alt: "Science and Technology Symposium for Youths 2023 award ceremony",
                          },
                          {
                            src: "/assets/gallery/thumbs/stsy-presentation.webp",
                            full: "/assets/gallery/stsy-presentation.webp",
                            alt: "Student presenting research at the Science and Technology Symposium for Youths",
                          },
                          {
                            src: "/assets/gallery/thumbs/stsy-auditorium.webp",
                            full: "/assets/gallery/stsy-auditorium.webp",
                            alt: "Science and Technology Symposium for Youths auditorium audience",
                          },
                          {
                            src: "/assets/gallery/thumbs/stsy-2024-group.webp",
                            full: "/assets/gallery/stsy-2024-group.webp",
                            alt: "Science and Technology Symposium for Youths 2024 group photo",
                          },
                          {
                            src: "/assets/gallery/thumbs/biochem-distillation.webp",
                            full: "/assets/gallery/biochem-distillation.webp",
                            alt: "Laboratory distillation apparatus",
                          },
                          {
                            src: "/assets/gallery/thumbs/biochem-water-bath.webp",
                            full: "/assets/gallery/biochem-water-bath.webp",
                            alt: "Laboratory water bath setup",
                          },
                          {
                            src: "/assets/gallery/thumbs/biochem-bottles.webp",
                            full: "/assets/gallery/biochem-bottles.webp",
                            alt: "Labeled experimental sample bottles",
                          },
                          {
                            src: "/assets/gallery/thumbs/biochem-culture-plate.webp",
                            full: "/assets/gallery/biochem-culture-plate.webp",
                            alt: "Culture plate with red flour beetles",
                          },
                        ]}
                      />
                    </div>
                  </article>{" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"2020–2022"}</time>
                    <div className={"timeline-entry"}>
                      <h3>{"Esports"}</h3>
                      <ul>
                        <li>
                          {
                            "Top 200 in Apex Legends (Asia), Ascendant in Valorant, five-digit rank in osu!, and Conqueror in PUBG Mobile."
                          }
                        </li>
                        <li>
                          {
                            "Also burned about 500 hours getting through the entire Zelda series pre-Breath of the Wild."
                          }
                        </li>
                      </ul>
                    </div>
                  </article>{" "}
                  <article className={"timeline-item"}>
                    <time className={"timeline-date"}>{"2017–2019"}</time>
                    <div className={"timeline-entry"}>
                      <h3>{"Still a kid"}</h3>
                      <ul>
                        <li>
                          {
                            "Around 400 hours in Roblox (mostly Arsenal), taught myself Kali Linux on a Raspberry Pi 4 I got for my birthday, and jailbroke half the phones in my house to overclock their CPU/GPU and learn how to install custom kernels and OS builds."
                          }
                        </li>
                        <li>
                          {
                            "I was part of my elementary school's robotics team, where I spent most of my time building with LEGO Mindstorms EV3; the team won third place at the National Robotics Competition (NRC)."
                          }
                        </li>
                      </ul>
                      <Gallery
                        label={"Childhood and robotics gallery"}
                        items={[
                          {
                            src: "/assets/gallery/thumbs/kid-robotics-ev3.webp",
                            full: "/assets/gallery/kid-robotics-ev3.webp",
                            alt: "LEGO Mindstorms EV3 robotics project",
                          },
                          {
                            src: "/assets/gallery/thumbs/kid-android-debugging.webp",
                            full: "/assets/gallery/kid-android-debugging.webp",
                            alt: "Android debugging setup on a laptop",
                          },
                        ]}
                      />
                    </div>
                  </article>{" "}
                </FocusScope>{" "}
              </div>{" "}
            </>
          ),
        },
        {
          id: "motivations",
          label: "My motivations",
          headingId: "motivations-heading",
          content: (
            <>
              {" "}
              <h2 id={"motivations-heading"}>{"My motivations"}</h2>{" "}
              <section
                className={"motivation-panel"}
                aria-label={"My Motivations"}
              >
                {" "}
                <section
                  className={"motivation-topic"}
                  aria-labelledby={"motivation-education"}
                >
                  {" "}
                  <h3 id={"motivation-education"}>
                    {"Education and opportunity inequality"}
                  </h3>{" "}
                  <p>
                    {
                      "I almost got kicked out of my secondary school because of the unfairness I faced at the Malaysia ISEF selection fair."
                    }
                  </p>{" "}
                  <p>
                    {
                      "Despite having the privilege of going to a top Chinese public school that allowed me to get into science research early on (which I'm still grateful for), I realised "
                    }
                    <strong>
                      {
                        "how unfair these opportunities are, hidden behind their own quiet privileges."
                      }
                    </strong>
                  </p>{" "}
                  <p>
                    {
                      "The most ironic part is that after I spent so much time on my first research project, I didn't make it to ISEF. I was really disappointed, especially after nearly a year of constant effort and skipping an entire year of school to do my research."
                    }
                  </p>{" "}
                  <p>
                    {
                      "When I asked the judges for feedback, I was told it was undisclosed. I emailed ISEF officials because I wanted to know how they had chosen the finalists. My school then told me to write an apology letter to the Ministry of Education."
                    }
                  </p>{" "}
                  <p>
                    {
                      "I was really upset about what happened at the fair. But the more I thought about it, the more I wondered how many students never even get the chance to do research."
                    }
                  </p>{" "}
                  <p>
                    {
                      "The lack of transparency isn't only about how students are judged. Access to research itself can be hard to see. Only a few schools in Malaysia even have science research opportunities like this, and many students don't even know they can take part in research at all. For students outside a handful of elite schools, the door to science research didn't even exist in the first place. Malaysia's Ministry of Education received "
                    }
                    <a
                      href={
                        "https://belanjawan.mof.gov.my/pdf/belanjawan2026/ucapan/bs26.pdf"
                      }
                      target={"_blank"}
                      rel={"noopener"}
                    >
                      {"RM66.2 billion"}
                    </a>
                    {
                      " in Budget 2026, yet too much of the effort goes into filler competitions and events, and we're still lacking when it comes to letting students break out of their boundaries."
                    }
                  </p>{" "}
                  <p>
                    {
                      "I hated seeing how systemic bias and structural barriers limit opportunities for youth talent, so I decided to take things into my own hands and founded "
                    }
                    <a
                      href={"https://www.myresearchguide.org/"}
                      target={"_blank"}
                      rel={"noopener"}
                    >
                      {"MYResearchGuide"}
                    </a>
                    {
                      " to help more youth across Malaysia access science research opportunities regardless of their background or socioeconomic status."
                    }
                  </p>{" "}
                  <p>
                    {
                      "Though this is just my first step toward democratising opportunity, I'm not waiting for the system to fix itself."
                    }
                  </p>{" "}
                  <blockquote className={"motivation-quote"}>
                    {
                      "I want to build the architecture that lets anyone, regardless of their background, get the shot they deserve."
                    }
                  </blockquote>{" "}
                </section>{" "}
                <section
                  className={"motivation-topic"}
                  aria-labelledby={"motivation-ai"}
                >
                  {" "}
                  <h3 id={"motivation-ai"}>
                    {"Putting AI to good use to advance humanity"}
                  </h3>{" "}
                  <p>
                    {
                      "I've spent enough time in AI research to see both sides of it up close."
                    }
                  </p>{" "}
                  <p>
                    {"One side is exciting. The "}
                    <a
                      href={
                        "https://www.nobelprize.org/prizes/chemistry/2024/press-release/"
                      }
                      target={"_blank"}
                      rel={"noopener"}
                    >
                      {"2024 Nobel Prize in Chemistry"}
                    </a>
                    {
                      " went to work on protein structure prediction, a problem biologists had been stuck on for decades until AI cracked it open. Moments like that convinced me AI isn't just a tool for automating tasks. "
                    }
                    <strong>
                      {"It can genuinely extend what humans can solve."}
                    </strong>
                  </p>{" "}
                  <p>
                    {
                      "The other side worries me. The companies building the most powerful AI systems aren't doing it purely out of curiosity or a desire to help people. There's an "
                    }
                    <a
                      href={"https://www.atlanticcouncil.org/?p=899346"}
                      target={"_blank"}
                      rel={"noopener"}
                    >
                      {
                        "enormous amount of money and geopolitical leverage on the line"
                      }
                    </a>
                    {
                      ", with the US and China alone pouring hundreds of billions into AI infrastructure and racing for dominance, and that changes the incentives. "
                    }
                    <a
                      href={
                        "https://www.business-standard.com/world-news/unchecked-ai-may-pose-catastrophic-risks-warns-un-panel-preliminary-report-126070101517_1.html"
                      }
                      target={"_blank"}
                      rel={"noopener"}
                    >
                      {"UN AI safety experts have warned"}
                    </a>
                    {
                      " that AI capability is already outpacing both scientific understanding and government policy, leaving governance fragmented and many countries reliant on systems they can't fully assess or control. "
                    }
                    <strong>{"What scares me"}</strong>
                    {
                      " is not just people losing jobs, but decisions increasingly resting on systems neither the public nor the people governing us fully understand."
                    }
                  </p>{" "}
                  <p>
                    {
                      "I don't think either outcome is guaranteed. This could end with AI making life better for most people, or with a small number of people holding all the power while everyone else gets left behind. Which one happens depends a lot on who's actually in the room shaping this, not just engineers, but policymakers, researchers, journalists, and people willing to hold this industry accountable."
                    }
                  </p>{" "}
                  <p>
                    {
                      "That future is still ours to shape. If we take AI's risks seriously early, we have a chance to share its benefits widely and address the dangers before they become impossible to ignore."
                    }
                  </p>{" "}
                  <p className={"motivation-closing"}>
                    {"That work has to start now, not later."}
                  </p>{" "}
                </section>{" "}
              </section>{" "}
            </>
          ),
        },
        {
          id: "honours",
          label: "Honours & awards",
          headingId: "awards-heading",
          content: (
            <>
              {" "}
              <h2 id={"awards-heading"}>{"Honours & awards"}</h2>{" "}
              <div className={"honors-panel"}>
                {" "}
                <section
                  className={"honors-group"}
                  aria-labelledby={"honours-heading"}
                >
                  {" "}
                  <h3 id={"honours-heading"}>{"Academic & research"}</h3>{" "}
                  <ul className={"honors-list"}>
                    {" "}
                    <li>
                      <strong>
                        {
                          "Malaysia Team — Intl. Olympiad on Astronomy and Astrophysics 2025 (IOAA)"
                        }
                      </strong>
                      <ul>
                        <li>
                          {
                            "Ranked 3rd nationally (with 3 months of preparation)"
                          }
                        </li>
                      </ul>
                    </li>{" "}
                    <li>
                      <strong>
                        {"Malaysia Team — Intl. Astronomy Olympiad 2025 (IAO)"}
                      </strong>
                      <ul>
                        <li>{"Ranked 2nd nationally"}</li>
                      </ul>
                    </li>{" "}
                    <li>
                      <strong>
                        {"Gold medal — Malaysian Physics Olympiad 2024"}
                      </strong>
                      <ul>
                        <li>{"Attended the national team training camp"}</li>
                      </ul>
                    </li>{" "}
                    <li>
                      <strong>
                        {"2x Participant — "}
                        <a
                          href={"https://eleuther.ai/soar/"}
                          target={"_blank"}
                          rel={"noopener"}
                        >
                          {"EleutherAI Summer of Open AI Research (SOAR)"}
                        </a>
                      </strong>
                      <ul>
                        <li>
                          {
                            "One of two high schoolers selected from 3,000+ applicants (spanning PhD, Master's, and undergrad candidates), acceptance rate <3%"
                          }
                        </li>
                      </ul>
                    </li>{" "}
                    <li>
                      <strong>
                        {
                          "Top 25 Finalist — Malaysia Science and Engineering Fair 2024 (PISTEK)"
                        }
                      </strong>
                    </li>{" "}
                  </ul>{" "}
                </section>{" "}
                <section
                  className={"honors-group"}
                  aria-labelledby={"miscellaneous-heading"}
                >
                  {" "}
                  <h3 id={"miscellaneous-heading"}>{"Miscellaneous"}</h3>{" "}
                  <ul className={"honors-list"}>
                    {" "}
                    <li>
                      <strong>{"YC Startup School 2026"}</strong>
                      <ul>
                        <li>
                          {"First and only Malaysian high schooler accepted"}
                        </li>
                      </ul>
                    </li>{" "}
                    <li>
                      <strong>
                        {
                          "Sigma Xi Scientific Honor Society Associate Member Nominee"
                        }
                      </strong>
                    </li>{" "}
                    <li>
                      <strong>
                        {
                          "Penang State Government Young Talent Excellence Award Awardee"
                        }
                      </strong>
                    </li>{" "}
                  </ul>{" "}
                </section>{" "}
              </div>{" "}
            </>
          ),
        },
      ]}
    />
  );
}
