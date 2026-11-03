import Link from "next/link";
import Image from "next/image";
import { Directory } from "@/components/directory";
import { Explanation } from "@/components/explanation";

const chertExplanation = [
  [
    "The idea",
    "A conversational video avatar gives an AI a visible presence during a live conversation. Speech, facial movement, and responses need to feel like parts of the same interaction. This project explores video diffusion models and the infrastructure needed to bring generated avatars into realtime human–AI conversations at Chert.",
  ],
  [
    "From generated video to a live conversation",
    "Generating a convincing clip is only one part of the challenge. In a live call, new speech and conversational context keep arriving, so video generation and delivery need to keep up. The central challenges are maintaining a consistent appearance across frames, matching facial movement to speech, and keeping delays short enough for natural turn-taking.",
  ],
  [
    "The takeaway",
    "A useful avatar needs both visual quality and responsiveness. Inference speed, audio–video synchronisation, and reliable streaming all shape how a conversation feels. The research goal is to connect video generation with a responsive interactive system, making the avatar useful throughout a call rather than only in a prepared clip.",
  ],
];

export function ProjectsContent() {
  return (
    <Directory
      kind="projects"
      heading={
        <header className={"card-page-heading"}>
          {" "}
          <div>
            <h1 className={"editorial-heading"}>{"my project board."}</h1>
            <p className={"page-intro"}>
              {"Research, papers, experiments, and things I've built."}
            </p>
          </div>{" "}
        </header>
      }
      groups={[
        {
          id: "project-papers",
          headingId: "papers-heading",
          title: "Peer-reviewed publications & preprints",
          entries: [
            {
              id: "asteroid-detection",
              searchText:
                "Ongoing Identification of Faint Near-Earth Asteroid Streak Candidates Using a Three-Channel Deep-Learning Pipeline. Shanghai Jiao Tong University · University of Maryland Drafting for journal submission Advised by Dr. Quanzhi Ye & Yiyang Guo ",
              className: "paper-showcase paper-showcase--text",
              content: (
                <article className={"paper-row"}>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"Ongoing"}</time>
                    <strong>
                      {
                        "Identification of Faint Near-Earth Asteroid Streak Candidates Using a Three-Channel Deep-Learning Pipeline."
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-sjtu"}
                        src={"/assets/logos/sjtu-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      <img
                        className={"logo-maryland"}
                        src={"/assets/logos/maryland-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"Shanghai Jiao Tong University · University of Maryland"}
                    </span>
                    <em>{"Drafting for journal submission"}</em>
                    <span className={"coauthors"}>
                      {"Advised by Dr. Quanzhi Ye & Yiyang Guo"}
                    </span>
                  </div>
                </article>
              ),
            },
            {
              id: "comet-classification",
              searchText:
                "Ongoing Feature-Based Comet Classification Pipeline for Zwicky Transient Facility (ZTF) Alert Image Streams. University of Maryland, Department of Astronomy Advised by Dr. Quanzhi Ye ",
              className: "paper-showcase paper-showcase--text",
              content: (
                <article className={"paper-row"}>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"Ongoing"}</time>
                    <strong>
                      {
                        "Feature-Based Comet Classification Pipeline for Zwicky Transient Facility (ZTF) Alert Image Streams."
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-maryland"}
                        src={"/assets/logos/maryland-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"University of Maryland, Department of Astronomy"}
                    </span>
                    <span className={"coauthors"}>
                      {"Advised by Dr. Quanzhi Ye"}
                    </span>
                  </div>
                </article>
              ),
            },
            {
              id: "platonic-representation",
              searchText:
                "2026 Shared Geometry Is Not Shared Physics: A Layerwise Test of the Platonic Representation Hypothesis in Astronomy UniverseTBD NeurIPS 2026 Interpretability for Discovery Workshop with Kshitij Duraphe et al. GitHub OpenReview arXiv The idea Two models can group the same galaxies similarly without encoding the same useful physics. Nearby points in representation space may reflect shared visual features rather than redshift or other physical properties. Genuine interchangeability requires more than similar geometry: a predictor trained on one survey should also remain useful when transferred to another. Layerwise alignment and transfer Matched optical images, infrared images, and spectra provide a common set of astronomical objects for comparing 36 pretrained models. Across 139 model-survey comparisons, neighborhood alignment measures agreement at different depths. Cross-survey prediction then compares layers chosen for geometric similarity with layers chosen for their ability to predict the target physical property. The takeaway Local alignment appears somewhere in every comparison, but does not generally increase with depth. Geometry-selected layers underperform label-selected layers in the image-transfer tests, and aligned final representations can still fail at redshift transfer. Similar neighborhoods therefore do not establish shared physical information; direct prediction and transfer tests remain necessary.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2610.04130"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: Shared Geometry Is Not Shared Physics: A Layerwise Test of the Platonic Representation Hypothesis in Astronomy"
                    }
                  >
                    <Image
                      src={
                        "/assets/paper-previews/platonic-representation.webp"
                      }
                      alt={
                        "First page of Shared Geometry Is Not Shared Physics: A Layerwise Test of the Platonic Representation Hypothesis in Astronomy"
                      }
                      loading={"lazy"}
                      width={480}
                      height={622}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2026"}</time>
                    <strong>
                      {
                        "Shared Geometry Is Not Shared Physics: A Layerwise Test of the Platonic Representation Hypothesis in Astronomy"
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        src={"/assets/logos/universetbd-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"UniverseTBD"}
                    </span>
                    <em>
                      {"NeurIPS 2026 Interpretability for Discovery Workshop"}
                    </em>
                    <span className={"coauthors"}>
                      {"with Kshitij Duraphe et al."}
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={"https://github.com/ksd3/layerwise-analysis"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                      <a
                        href={"https://openreview.net/forum?id=Xw72C0uPBw"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"OpenReview"}
                      </a>
                      <a
                        href={"https://arxiv.org/abs/2610.04130"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Two models can group the same galaxies similarly without encoding the same useful physics. Nearby points in representation space may reflect shared visual features rather than redshift or other physical properties. Genuine interchangeability requires more than similar geometry: a predictor trained on one survey should also remain useful when transferred to another.",
                      ],
                      [
                        "Layerwise alignment and transfer",
                        "Matched optical images, infrared images, and spectra provide a common set of astronomical objects for comparing 36 pretrained models. Across 139 model-survey comparisons, neighborhood alignment measures agreement at different depths. Cross-survey prediction then compares layers chosen for geometric similarity with layers chosen for their ability to predict the target physical property.",
                      ],
                      [
                        "The takeaway",
                        "Local alignment appears somewhere in every comparison, but does not generally increase with depth. Geometry-selected layers underperform label-selected layers in the image-transfer tests, and aligned final representations can still fail at redshift transfer. Similar neighborhoods therefore do not establish shared physical information; direct prediction and transfer tests remain necessary.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "perturbation-robustness",
              searchText:
                "2026 How Perturbations Propagate: A Multi-Level Analysis of Robustness in Large Language Models EleutherAI NeurIPS 2026 Interpscience Workshop with Emily Liu et al. GitHub arXiv The idea A typo changes the form of individual words, while shuffling changes their order and context. Both can hurt predictions, but the disruption can begin at different depths and affect different attention functions. Tracking the path from altered input to hidden states to output reveals distinctions that a final accuracy or loss score misses. Tracing disruption through the model Six perturbations, including character edits, token substitutions, and shuffling, are evaluated through output behavior, layerwise representations, and attention-head function. Behavioral comparisons span four GPT-2 and two Qwen2.5 checkpoints; head-level analysis focuses on GPT-2. Gradient-guided HotFlip substitutions are compared with random substitutions at the same edit rate to separate targeted disruption from the amount of corruption. The takeaway Different perturbations leave different internal signatures, and HotFlip is more disruptive than matched random edits in the tested settings. Patterns are only partly consistent across checkpoints. Robustness is therefore better understood through complementary behavioral and internal measurements than through a single output score or representation metric.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2609.03322"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: How Perturbations Propagate: A Multi-Level Analysis of Robustness in Large Language Models"
                    }
                  >
                    <Image
                      src={
                        "/assets/paper-previews/perturbation-robustness.webp"
                      }
                      alt={
                        "First page of How Perturbations Propagate: A Multi-Level Analysis of Robustness in Large Language Models"
                      }
                      loading={"lazy"}
                      width={480}
                      height={622}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2026"}</time>
                    <strong>
                      {
                        "How Perturbations Propagate: A Multi-Level Analysis of Robustness in Large Language Models"
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-eleutherai"}
                        src={"/assets/logos/eleutherai-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"EleutherAI"}
                    </span>
                    <em>{"NeurIPS 2026 Interpscience Workshop"}</em>
                    <span className={"coauthors"}>
                      {"with Emily Liu et al."}
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://github.com/emilyzfliu/decoding-robustness"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                      <a
                        href={"https://arxiv.org/abs/2609.03322"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "A typo changes the form of individual words, while shuffling changes their order and context. Both can hurt predictions, but the disruption can begin at different depths and affect different attention functions. Tracking the path from altered input to hidden states to output reveals distinctions that a final accuracy or loss score misses.",
                      ],
                      [
                        "Tracing disruption through the model",
                        "Six perturbations, including character edits, token substitutions, and shuffling, are evaluated through output behavior, layerwise representations, and attention-head function. Behavioral comparisons span four GPT-2 and two Qwen2.5 checkpoints; head-level analysis focuses on GPT-2. Gradient-guided HotFlip substitutions are compared with random substitutions at the same edit rate to separate targeted disruption from the amount of corruption.",
                      ],
                      [
                        "The takeaway",
                        "Different perturbations leave different internal signatures, and HotFlip is more disruptive than matched random edits in the tested settings. Patterns are only partly consistent across checkpoints. Robustness is therefore better understood through complementary behavioral and internal measurements than through a single output score or representation metric.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "nonlinear-queries",
              searchText:
                "2026 Beyond Query Linearity: The Case for Nonlinear Queries. EleutherAI NeurIPS 2026 SLM-Agents Workshop · Poster with Marko Karbevski et al. GitHub OpenReview The idea Attention uses queries to decide which information to retrieve. A learned linear query projection can be partly redundant with surrounding transformations: it may change coordinates without adding a genuinely new function. A nonlinear query pathway can break that symmetry, offering a way to spend a similar parameter budget on a richer computation instead. Nonlinear query projections A residual bottleneck network replaces the usual linear query projection, adding a nonlinear transformation before attention scores are computed. Matched-parameter linear baselines help isolate the effect of the query function rather than extra model capacity. Varying the learning-rate schedule tests how much of the benefit depends on the optimization setup. The takeaway In the reported 124M-model experiments, validation log-loss improves by roughly 0.3% to 2.4%, depending on the learning-rate schedule. A small change to the query pathway can therefore improve how a fixed parameter budget is used. The schedule dependence also makes training configuration an important part of evaluating the architecture.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://openreview.net/forum?id=M8z9uMfxk5"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: Beyond Query Linearity: The Case for Nonlinear Queries."
                    }
                  >
                    <Image
                      src={"/assets/paper-previews/nonlinear-queries.webp"}
                      alt={
                        "First page of Beyond Query Linearity: The Case for Nonlinear Queries."
                      }
                      loading={"lazy"}
                      width={480}
                      height={622}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2026"}</time>
                    <strong>
                      {
                        "Beyond Query Linearity: The Case for Nonlinear Queries."
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-eleutherai"}
                        src={"/assets/logos/eleutherai-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"EleutherAI"}
                    </span>
                    <em>{"NeurIPS 2026 SLM-Agents Workshop · Poster"}</em>
                    <span className={"coauthors"}>
                      {"with Marko Karbevski et al."}
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://github.com/MarkoKarbevski/beyond_query_linearity_community"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                      <a
                        href={"https://openreview.net/forum?id=M8z9uMfxk5"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"OpenReview"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Attention uses queries to decide which information to retrieve. A learned linear query projection can be partly redundant with surrounding transformations: it may change coordinates without adding a genuinely new function. A nonlinear query pathway can break that symmetry, offering a way to spend a similar parameter budget on a richer computation instead.",
                      ],
                      [
                        "Nonlinear query projections",
                        "A residual bottleneck network replaces the usual linear query projection, adding a nonlinear transformation before attention scores are computed. Matched-parameter linear baselines help isolate the effect of the query function rather than extra model capacity. Varying the learning-rate schedule tests how much of the benefit depends on the optimization setup.",
                      ],
                      [
                        "The takeaway",
                        "In the reported 124M-model experiments, validation log-loss improves by roughly 0.3% to 2.4%, depending on the learning-rate schedule. A small change to the query pathway can therefore improve how a fixed parameter budget is used. The schedule dependence also makes training configuration an important part of evaluating the architecture.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "latent-safety-probes",
              searchText:
                "08/2026 Do All LLMs Know When They're Being Harmful? A Reproducibility Study of Latent-Space Safety Probes Across Model Families. Independent Research Preprint with Alizishaan Khatri arXiv The idea A language model's internal activations can contain information about whether a prompt is harmful. A small classifier, or probe, can read those activations instead of requiring a separate large guard model. The key question is whether this signal remains useful across model families and reproducible across repeated activation extraction. Probing final-token activations Final-layer activations at the last token become features for harm classifiers. Reproducing the LLaMA setup and extending the pipeline to Gemma, Mistral, and Qwen tests portability across open-weight backbones. WildJailbreak, BeaverTails, and AEGIS 2.0 provide evaluation data, while repeated extraction with different random seeds checks feature stability. The takeaway The original LLaMA benchmark F1 scores are reproduced within 0.37 percentage points, with useful results on the additional model families. Final-token representations remain unchanged across the tested extraction seeds. Lightweight probes can capture benchmark harm signals reliably in this setup, although classifying harmful prompts is narrower than establishing deployment safety.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2608.08029"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: Do All LLMs Know When They're Being Harmful? A Reproducibility Study of Latent-Space Safety Probes Across Model Families."
                    }
                  >
                    <Image
                      src={"/assets/paper-previews/latent-safety-probes.webp"}
                      alt={
                        "First page of Do All LLMs Know When They're Being Harmful? A Reproducibility Study of Latent-Space Safety Probes Across Model Families."
                      }
                      loading={"lazy"}
                      width={480}
                      height={679}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"08/2026"}</time>
                    <strong>
                      {
                        "Do All LLMs Know When They're Being Harmful? A Reproducibility Study of Latent-Space Safety Probes Across Model Families."
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      {"Independent Research"}
                    </span>
                    <em>{"Preprint"}</em>
                    <span className={"coauthors"}>
                      {"with Alizishaan Khatri"}
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={"https://arxiv.org/abs/2608.08029"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "A language model's internal activations can contain information about whether a prompt is harmful. A small classifier, or probe, can read those activations instead of requiring a separate large guard model. The key question is whether this signal remains useful across model families and reproducible across repeated activation extraction.",
                      ],
                      [
                        "Probing final-token activations",
                        "Final-layer activations at the last token become features for harm classifiers. Reproducing the LLaMA setup and extending the pipeline to Gemma, Mistral, and Qwen tests portability across open-weight backbones. WildJailbreak, BeaverTails, and AEGIS 2.0 provide evaluation data, while repeated extraction with different random seeds checks feature stability.",
                      ],
                      [
                        "The takeaway",
                        "The original LLaMA benchmark F1 scores are reproduced within 0.37 percentage points, with useful results on the additional model families. Final-token representations remain unchanged across the tested extraction seeds. Lightweight probes can capture benchmark harm signals reliably in this setup, although classifying harmful prompts is narrower than establishing deployment safety.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "symbolic-music-genres",
              searchText:
                "07/2026 Large-Scale Symbolic Music Genre Classification under Class Imbalance using Graph-Based MIDI Embeddings (part of GigaMIDI projects). Metacreation Lab · Simon Fraser University Drafting for TISMIR Advised by Prof. Philippe Pasquier & Keon Ju Maverick Lee Paper The idea Music collections contain many examples of popular genres and far fewer of rare ones. A classifier can achieve high overall accuracy by favoring the common classes while barely recognizing the rest. Genre-balanced evaluation makes those failures visible, using the musical events and structure in MIDI rather than recorded audio. Graph embeddings and class balancing Each MIDI file is represented by a 128-dimensional graph-based embedding for an 11-genre classification task. A human-annotated ground-truth set supports comparisons between an unbalanced baseline, class-sensitive learning, SMOTE oversampling, and undersampling strategies. Macro recall weights genres equally, while worst-class recall highlights the weakest-performing genre. The takeaway SMOTE oversampling with logistic regression gives the strongest genre-balanced results among the tested methods. Applying the classifier produces predicted genre labels for over three million MIDI files. These automatic labels expand symbolic-music resources, while the balanced metrics show why strong aggregate accuracy need not mean reliable recognition of rare genres.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={
                      "https://drive.google.com/file/d/1KwlyPhz1iGwa_f1jHtaqDN6pFNm_c75P/view?usp=sharing"
                    }
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: Large-Scale Symbolic Music Genre Classification under Class Imbalance using Graph-Based MIDI Embeddings (part of GigaMIDI projects)."
                    }
                  >
                    <Image
                      src={"/assets/paper-previews/symbolic-music-genres.webp"}
                      alt={
                        "First page of Large-Scale Symbolic Music Genre Classification under Class Imbalance using Graph-Based MIDI Embeddings (part of GigaMIDI projects)."
                      }
                      loading={"lazy"}
                      width={480}
                      height={679}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"07/2026"}</time>
                    <strong>
                      {
                        "Large-Scale Symbolic Music Genre Classification under Class Imbalance using Graph-Based MIDI Embeddings (part of GigaMIDI projects)."
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-metacreation"}
                        src={"/assets/logos/metacreation-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"Metacreation Lab · Simon Fraser University"}
                    </span>
                    <em>{"Drafting for TISMIR"}</em>
                    <span className={"coauthors"}>
                      {
                        "Advised by Prof. Philippe Pasquier & Keon Ju Maverick Lee"
                      }
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://drive.google.com/file/d/1KwlyPhz1iGwa_f1jHtaqDN6pFNm_c75P/view?usp=sharing"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Paper"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Music collections contain many examples of popular genres and far fewer of rare ones. A classifier can achieve high overall accuracy by favoring the common classes while barely recognizing the rest. Genre-balanced evaluation makes those failures visible, using the musical events and structure in MIDI rather than recorded audio.",
                      ],
                      [
                        "Graph embeddings and class balancing",
                        "Each MIDI file is represented by a 128-dimensional graph-based embedding for an 11-genre classification task. A human-annotated ground-truth set supports comparisons between an unbalanced baseline, class-sensitive learning, SMOTE oversampling, and undersampling strategies. Macro recall weights genres equally, while worst-class recall highlights the weakest-performing genre.",
                      ],
                      [
                        "The takeaway",
                        "SMOTE oversampling with logistic regression gives the strongest genre-balanced results among the tested methods. Applying the classifier produces predicted genre labels for over three million MIDI files. These automatic labels expand symbolic-music resources, while the balanced metrics show why strong aggregate accuracy need not mean reliable recognition of rare genres.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "anthropogenic-vlm",
              searchText:
                "04/2026 Anthropogenic Regional Adaptation in Multimodal Vision-Language Models. SEACrowd AACL-IJCNLP 2026 Findings with Samuel Cahyawijaya, Peerat Limkonchotiwat et al. arXiv The idea Strong global benchmark scores can hide weak understanding of a region's objects, language, and cultural context. Regional adaptation should improve local relevance without erasing broader capabilities. That requires measuring both goals together rather than assuming that better regional performance automatically preserves global performance. Regional filtering and model merging GG-EZ combines regional data filtering with model merging, using Southeast Asia as the adaptation setting. Comparisons cover large vision-language models, text-to-image models, and vision-language embedding models. Regional cultural-relevance metrics measure the local benefit, while broader evaluations track how much general capability is retained. The takeaway Southeast Asian cultural-relevance metrics improve by 5-15% while over 98% of measured global performance is retained. Regional filtering and merging can therefore improve local usefulness without a large measured global trade-off. The size of that benefit remains tied to the selected datasets and evaluations.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2604.11490"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: Anthropogenic Regional Adaptation in Multimodal Vision-Language Models."
                    }
                  >
                    <Image
                      src={"/assets/paper-previews/anthropogenic-vlm.webp"}
                      alt={
                        "First page of Anthropogenic Regional Adaptation in Multimodal Vision-Language Models."
                      }
                      loading={"lazy"}
                      width={480}
                      height={622}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"04/2026"}</time>
                    <strong>
                      {
                        "Anthropogenic Regional Adaptation in Multimodal Vision-Language Models."
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        src={"/assets/logos/seacrowd-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"SEACrowd"}
                    </span>
                    <em>{"AACL-IJCNLP 2026 Findings"}</em>
                    <span className={"coauthors"}>
                      {"with Samuel Cahyawijaya, Peerat Limkonchotiwat et al."}
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={"https://arxiv.org/abs/2604.11490"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Strong global benchmark scores can hide weak understanding of a region's objects, language, and cultural context. Regional adaptation should improve local relevance without erasing broader capabilities. That requires measuring both goals together rather than assuming that better regional performance automatically preserves global performance.",
                      ],
                      [
                        "Regional filtering and model merging",
                        "GG-EZ combines regional data filtering with model merging, using Southeast Asia as the adaptation setting. Comparisons cover large vision-language models, text-to-image models, and vision-language embedding models. Regional cultural-relevance metrics measure the local benefit, while broader evaluations track how much general capability is retained.",
                      ],
                      [
                        "The takeaway",
                        "Southeast Asian cultural-relevance metrics improve by 5-15% while over 98% of measured global performance is retained. Regional filtering and merging can therefore improve local usefulness without a large measured global trade-off. The size of that benefit remains tied to the selected datasets and evaluations.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "low-resource-translation",
              searchText:
                "03/2026 Can Linguistically Related Languages Guide LLM Translation in Low-Resource Settings? EleutherAI EACL 2026 - LoResMT Workshop with Aishwarya Ramasethu, Niyathi Allu, Rohin Garg, Harshwardhan Fartale GitHub Official arXiv Poster The idea A better-resourced related language can act as a bridge when translation examples in a target language are scarce. Shared linguistic structure may help connect an unfamiliar expression to patterns the model already knows. Supplying that bridge in the prompt offers an inference-time alternative to collecting enough data for fine-tuning. Pivot-language prompting Translation prompts combine a linguistically related pivot language with a small number of demonstrations, leaving model parameters unchanged. Controlled comparisons vary the guidance and construction of the few-shot examples to identify when the bridge helps. This separates the effect of prompt design from improvements that would require additional training. The takeaway Pivot-based prompting helps in some configurations, especially when the target language is poorly represented in the model vocabulary. Gains are often modest and sensitive to example choice; closely related or better-represented varieties can benefit inconsistently. Linguistic relatedness is therefore a useful starting point for prompt design, not a guarantee of better translation.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2603.16660"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: Can Linguistically Related Languages Guide LLM Translation in Low-Resource Settings?"
                    }
                  >
                    <Image
                      src={
                        "/assets/paper-previews/low-resource-translation.webp"
                      }
                      alt={
                        "First page of Can Linguistically Related Languages Guide LLM Translation in Low-Resource Settings?"
                      }
                      loading={"lazy"}
                      width={480}
                      height={679}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"03/2026"}</time>
                    <strong>
                      {
                        "Can Linguistically Related Languages Guide LLM Translation in Low-Resource Settings?"
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-eleutherai"}
                        src={"/assets/logos/eleutherai-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"EleutherAI"}
                    </span>
                    <em>{"EACL 2026 - LoResMT Workshop"}</em>
                    <span className={"coauthors"}>
                      {
                        "with Aishwarya Ramasethu, Niyathi Allu, Rohin Garg, Harshwardhan Fartale"
                      }
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://github.com/aramasethu/low_resource_language_translation"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                      <a
                        href={"https://aclanthology.org/2026.loresmt-1.14.pdf"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Official"}
                      </a>
                      <a
                        href={"https://arxiv.org/abs/2603.16660"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                      <a
                        href={
                          "https://drive.google.com/file/d/1zf_y5IH0pocmyJOfAnTqMxEvWU9k10_D/view?usp=sharing"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Poster"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "A better-resourced related language can act as a bridge when translation examples in a target language are scarce. Shared linguistic structure may help connect an unfamiliar expression to patterns the model already knows. Supplying that bridge in the prompt offers an inference-time alternative to collecting enough data for fine-tuning.",
                      ],
                      [
                        "Pivot-language prompting",
                        "Translation prompts combine a linguistically related pivot language with a small number of demonstrations, leaving model parameters unchanged. Controlled comparisons vary the guidance and construction of the few-shot examples to identify when the bridge helps. This separates the effect of prompt design from improvements that would require additional training.",
                      ],
                      [
                        "The takeaway",
                        "Pivot-based prompting helps in some configurations, especially when the target language is poorly represented in the model vocabulary. Gains are often modest and sensitive to example choice; closely related or better-represented varieties can benefit inconsistently. Linguistic relatedness is therefore a useful starting point for prompt design, not a guarantee of better translation.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "symbolic-piano-continuation",
              searchText:
                "09/2025 A Traditional Approach to Symbolic Piano Continuation. EleutherAI SOAR ISMIR 2025 - MIREX with Christian Zhou-Zheng, John Backsund, Alex Coventry, Avid Eslami, Jyotin Goel, Xingwen Han, Danysh Soomro, Galen Wei Official arXiv The idea For a narrow task, a small model with suitable data and a straightforward training objective may compete with a much larger general-purpose system. Here the task is continuing a short piano passage coherently, rather than generating every kind of music. The approach brings next-token prediction back to tokenized MIDI without adding an elaborate control mechanism. Next-token piano continuation A roughly 20-million-parameter RWKV-7 model learns next-token prediction over MIDI sequences. A four-measure piano prompt conditions a twelve-measure continuation, allowing the generated passage to be judged against its musical starting point. MIREX listener ratings compare selected generations on coherence, structure, creativity, and musicality against other entries and much larger baselines. The takeaway The small model is competitive with the much larger Anticipatory baseline on the reported musical-quality ratings. Task-focused data and a straightforward objective can matter as much as scale for this constrained piano task. The comparison uses a small listening study with team-selected samples, rather than an unrestricted evaluation of all generated music.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2509.12267"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: A Traditional Approach to Symbolic Piano Continuation."
                    }
                  >
                    <Image
                      src={
                        "/assets/paper-previews/symbolic-piano-continuation.webp"
                      }
                      alt={
                        "First page of A Traditional Approach to Symbolic Piano Continuation."
                      }
                      loading={"lazy"}
                      width={480}
                      height={679}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"09/2025"}</time>
                    <strong>
                      {"A Traditional Approach to Symbolic Piano Continuation."}
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        className={"logo-eleutherai"}
                        src={"/assets/logos/eleutherai-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      {"EleutherAI SOAR"}
                    </span>
                    <em>{"ISMIR 2025 - MIREX"}</em>
                    <span className={"coauthors"}>
                      {
                        "with Christian Zhou-Zheng, John Backsund, Alex Coventry, Avid Eslami, Jyotin Goel, Xingwen Han, Danysh Soomro, Galen Wei"
                      }
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://music-ir.org/mirex/wiki/2025:Symbolic_Music_Generation_Results"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Official"}
                      </a>
                      <a
                        href={"https://arxiv.org/abs/2509.12267"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "For a narrow task, a small model with suitable data and a straightforward training objective may compete with a much larger general-purpose system. Here the task is continuing a short piano passage coherently, rather than generating every kind of music. The approach brings next-token prediction back to tokenized MIDI without adding an elaborate control mechanism.",
                      ],
                      [
                        "Next-token piano continuation",
                        "A roughly 20-million-parameter RWKV-7 model learns next-token prediction over MIDI sequences. A four-measure piano prompt conditions a twelve-measure continuation, allowing the generated passage to be judged against its musical starting point. MIREX listener ratings compare selected generations on coherence, structure, creativity, and musicality against other entries and much larger baselines.",
                      ],
                      [
                        "The takeaway",
                        "The small model is competitive with the much larger Anticipatory baseline on the reported musical-quality ratings. Task-focused data and a straightforward objective can matter as much as scale for this constrained piano task. The comparison uses a small listening study with team-selected samples, rather than an unrestricted evaluation of all generated music.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
          ],
        },
        {
          id: "project-acknowledgements",
          headingId: "acknowledgements-heading",
          title: "Acknowledgements",
          entries: [
            {
              id: "platonic-universe-acknowledgement",
              searchText:
                "09/2025 The Platonic Universe: Do Foundation Models See the Same Sky? UniverseTBD Machine Learning and the Physical Sciences Workshop · NeurIPS 2025 Acknowledged for discussions and comments that improved the paper. GitHub arXiv The idea Do models trained on different data learn a shared picture of the same physical universe? Astronomy provides an external reference: the same galaxy can be observed with different telescopes and through different modalities, while physical properties provide a way to judge what the representations actually capture. This makes it possible to compare similarity with scientific usefulness. Frozen representations and physical properties Matched telescope images and spectra allow comparisons across eleven foundation-model families without changing their weights. Probes test how well the frozen representations encode redshift, stellar mass, and other physical properties. Local neighborhood similarity and global geometric alignment provide two different ways to compare representations across architectures, training approaches, and capacities. The takeaway Model capacity predicts physical-property performance, while local alignment tracks that performance better than global geometric alignment in the studied comparisons. Observations of the same physical objects create a useful testbed for distinguishing shared representation structure from information that supports scientific prediction.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://arxiv.org/abs/2509.19453"}
                    className={"paper-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "Read paper: The Platonic Universe: Do Foundation Models See the Same Sky?"
                    }
                  >
                    <Image
                      src={
                        "/assets/paper-previews/platonic-universe-acknowledgement.webp"
                      }
                      alt={
                        "First page of The Platonic Universe: Do Foundation Models See the Same Sky?"
                      }
                      loading={"lazy"}
                      width={480}
                      height={622}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"09/2025"}</time>
                    <strong>
                      {
                        "The Platonic Universe: Do Foundation Models See the Same Sky?"
                      }
                    </strong>
                    <span className={"project-affiliation"}>
                      <img
                        src={"/assets/logos/universetbd-square.webp"}
                        alt={""}
                        loading="lazy"
                        width={16}
                        height={16}
                      />
                      <a
                        href={"https://universetbd.org/"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"UniverseTBD"}
                      </a>
                    </span>
                    <em>
                      {
                        "Machine Learning and the Physical Sciences Workshop · NeurIPS 2025"
                      }
                    </em>
                    <span className={"project-description"}>
                      {
                        "Acknowledged for discussions and comments that improved the paper."
                      }
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://github.com/UniverseTBD/platonic-universe"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                      <a
                        href={"https://arxiv.org/abs/2509.19453"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"arXiv"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Do models trained on different data learn a shared picture of the same physical universe? Astronomy provides an external reference: the same galaxy can be observed with different telescopes and through different modalities, while physical properties provide a way to judge what the representations actually capture. This makes it possible to compare similarity with scientific usefulness.",
                      ],
                      [
                        "Frozen representations and physical properties",
                        "Matched telescope images and spectra allow comparisons across eleven foundation-model families without changing their weights. Probes test how well the frozen representations encode redshift, stellar mass, and other physical properties. Local neighborhood similarity and global geometric alignment provide two different ways to compare representations across architectures, training approaches, and capacities.",
                      ],
                      [
                        "The takeaway",
                        "Model capacity predicts physical-property performance, while local alignment tracks that performance better than global geometric alignment in the studied comparisons. Observations of the same physical objects create a useful testbed for distinguishing shared representation structure from information that supports scientific prediction.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
          ],
        },
        {
          id: "project-builds",
          headingId: "projects-heading",
          title: "Projects",
          entries: [
            {
              id: "chert",
              searchText:
                "2026 Conversational video avatars model (Chert (YC P26)) Realtime video diffusion avatar model infra Demo GitHub " +
                chertExplanation.flat().join(" "),
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  {" "}
                  <Link
                    className={"paper-thumbnail project-thumbnail"}
                    href={"/projects/chert/"}
                    aria-label={
                      "Try the Chert conversational video avatar demo"
                    }
                  >
                    <Image
                      src={"/assets/project-previews/chert.png"}
                      alt={
                        "Chert conversational video avatar during a live call"
                      }
                      width={"1351"}
                      height={"1030"}
                      loading={"lazy"}
                      decoding={"async"}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </Link>{" "}
                  <div className={"paper-info"}>
                    {" "}
                    <time className={"paper-date"}>{"2026"}</time>{" "}
                    <strong>
                      {"Conversational video avatars model ("}
                      <a
                        className={"project-title-link"}
                        href={"https://www.trychert.com/"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Chert (YC P26)"}
                      </a>
                      {")"}
                    </strong>{" "}
                    <span className={"project-description"}>
                      {"Realtime video diffusion avatar model infra"}
                    </span>{" "}
                    <div className={"paper-links"}>
                      <Link href={"/projects/chert/"}>{"Demo"}</Link>
                      <a
                        href={"https://github.com/cherthq/realtime-research"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                    </div>{" "}
                  </div>{" "}
                  <Explanation sections={chertExplanation} />
                </article>
              ),
            },
            {
              id: "beamline-straggling",
              searchText:
                "2026 Finding the complex permittivity as a function of energy using angular straggling Experimental proposal · CERN Beamline for Schools 2026 A Geant4 simulation project for studying particle interactions and analysis workflows for the proposed beam experiment. Proposal GitHub The idea Protons passing through tungsten undergo many small deflections, producing a spread of outgoing angles called angular straggling. That spread contains information about the underlying collisions. Connecting the scattering cross section to the Fermi-Virtual Photon model offers a proposed route to estimating energy-dependent complex permittivity: the real and imaginary parts describing a material's electromagnetic response. From scattering angles to permittivity Upstream and downstream wire-chamber pairs reconstruct incoming and outgoing proton tracks, while Cherenkov detectors support particle identification. Removing the baseline beam spread by deconvolution isolates the target's contribution. A Poisson-weighted multiple-scattering model then estimates a single-collision cross section; a relativistic angle-to-energy transformation and numerical inversion of the FVP relation connect it to permittivity. Geant4 simulations support the angular-distribution analysis. The takeaway Angular measurements provide an indirect route from visible track deflections to a material's microscopic response. Reliable inversion depends on beam-profile calibration, detector resolution, the scattering model, and enough events to constrain small angles. Current numerical simulations leave the very-small-angle cross section poorly constrained; the proposed beam measurements would supply data to test the reconstruction and FVP predictions.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://github.com/bunchofcellulose/bl4s2026"}
                    className={"paper-thumbnail project-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "View project: Finding the complex permittivity as a function of energy using angular straggling"
                    }
                  >
                    <Image
                      src={"/assets/project-previews/beamline-straggling.webp"}
                      alt={
                        "Preview of Finding the complex permittivity as a function of energy using angular straggling"
                      }
                      loading={"lazy"}
                      width={488}
                      height={366}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2026"}</time>
                    <strong>
                      {
                        "Finding the complex permittivity as a function of energy using angular straggling"
                      }
                    </strong>
                    <em>
                      {"Experimental proposal · CERN Beamline for Schools 2026"}
                    </em>
                    <span className={"project-description"}>
                      {
                        "A Geant4 simulation project for studying particle interactions and analysis workflows for the proposed beam experiment."
                      }
                    </span>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://drive.google.com/file/d/1BrebBET4nnph5qcTX73HPzpekXX5UH98/view?usp=sharing"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"Proposal"}
                      </a>
                      <a
                        href={"https://github.com/bunchofcellulose/bl4s2026"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Protons passing through tungsten undergo many small deflections, producing a spread of outgoing angles called angular straggling. That spread contains information about the underlying collisions. Connecting the scattering cross section to the Fermi-Virtual Photon model offers a proposed route to estimating energy-dependent complex permittivity: the real and imaginary parts describing a material's electromagnetic response.",
                      ],
                      [
                        "From scattering angles to permittivity",
                        "Upstream and downstream wire-chamber pairs reconstruct incoming and outgoing proton tracks, while Cherenkov detectors support particle identification. Removing the baseline beam spread by deconvolution isolates the target's contribution. A Poisson-weighted multiple-scattering model then estimates a single-collision cross section; a relativistic angle-to-energy transformation and numerical inversion of the FVP relation connect it to permittivity. Geant4 simulations support the angular-distribution analysis.",
                      ],
                      [
                        "The takeaway",
                        "Angular measurements provide an indirect route from visible track deflections to a material's microscopic response. Reliable inversion depends on beam-profile calibration, detector resolution, the scattering model, and enough events to constrain small angles. Current numerical simulations leave the very-small-angle cross section poorly constrained; the proposed beam measurements would supply data to test the reconstruction and FVP predictions.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "magnetic-ring",
              searchText:
                "2024 Magnetic Field of Cylindrical Axially Magnetized Ring Simulates and visualizes the magnetic field of an axially magnetized cylindrical ring using the Biot–Savart law. GitHub The idea A ring magnet produces a field whose direction and strength change with position. Adding the contributions of many small current elements preserves the ring geometry instead of collapsing it into a single point source. This makes the field inside the opening and around the magnet directly comparable. Biot-Savart field mapping Numerical summation of Biot-Savart contributions gives the magnetic field at points on an x-y grid. A vector plot shows field direction, while a heatmap shows field strength. Comparing nearby sampling positions reveals how sensitive the calculated field is to small spatial changes. The takeaway Field maps connect the ring's geometry to a spatial pattern that is difficult to infer from the equations alone. Finer sampling and more current elements improve numerical resolution but increase computation. Strong variation between nearby positions describes a spatial gradient; by itself, it does not establish chaotic time evolution.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={
                      "https://github.com/Ehdunhackme/Magnetic-Field-of-Cylindrical-Axially-Magnetized-Ring"
                    }
                    className={"paper-thumbnail project-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "View project: Magnetic Field of Cylindrical Axially Magnetized Ring"
                    }
                  >
                    <Image
                      src={"/assets/project-previews/magnetic-ring.webp"}
                      alt={
                        "Preview of Magnetic Field of Cylindrical Axially Magnetized Ring"
                      }
                      loading={"lazy"}
                      width={341}
                      height={356}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2024"}</time>
                    <strong>
                      {"Magnetic Field of Cylindrical Axially Magnetized Ring"}
                    </strong>
                    <em>
                      {
                        "Simulates and visualizes the magnetic field of an axially magnetized cylindrical ring using the Biot–Savart law."
                      }
                    </em>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://github.com/Ehdunhackme/Magnetic-Field-of-Cylindrical-Axially-Magnetized-Ring"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "A ring magnet produces a field whose direction and strength change with position. Adding the contributions of many small current elements preserves the ring geometry instead of collapsing it into a single point source. This makes the field inside the opening and around the magnet directly comparable.",
                      ],
                      [
                        "Biot-Savart field mapping",
                        "Numerical summation of Biot-Savart contributions gives the magnetic field at points on an x-y grid. A vector plot shows field direction, while a heatmap shows field strength. Comparing nearby sampling positions reveals how sensitive the calculated field is to small spatial changes.",
                      ],
                      [
                        "The takeaway",
                        "Field maps connect the ring's geometry to a spatial pattern that is difficult to infer from the equations alone. Finer sampling and more current elements improve numerical resolution but increase computation. Strong variation between nearby positions describes a spatial gradient; by itself, it does not establish chaotic time evolution.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "double-pendulum",
              searchText:
                "2024 Chaotic Behavior of Double Pendulum Numerically simulates double-pendulum dynamics with coupled nonlinear equations and Runge–Kutta integration. GitHub The idea A double pendulum is mechanically simple but can produce remarkably complicated motion. Because the two arms influence one another through nonlinear dynamics, a small change in the starting configuration can lead to very different trajectories. It is a compact way to explore the difference between deterministic equations and easy long-term prediction. Coupled motion and numerical integration The angles and angular velocities of the two arms form a coupled system of nonlinear equations. Runge-Kutta integration advances that state through small time steps, and the resulting positions trace each mass's path. Changing the initial angles or velocities allows nearby starting states to be compared as their trajectories evolve. The takeaway Deterministic equations can produce motion that is hard to predict far ahead because small initial differences grow. Numerical error can also accumulate, so smaller time steps and convergence checks help distinguish physical sensitivity from solver artifacts. The trajectories make both nonlinear coupling and the limits of long-term prediction visible.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={
                      "https://github.com/Ehdunhackme/Chaotic-Behavior-of-Double-Pendulum"
                    }
                    className={"paper-thumbnail project-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={
                      "View project: Chaotic Behavior of Double Pendulum"
                    }
                  >
                    <Image
                      src={"/assets/project-previews/double-pendulum.webp"}
                      alt={"Preview of Chaotic Behavior of Double Pendulum"}
                      loading={"lazy"}
                      width={364}
                      height={375}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2024"}</time>
                    <strong>{"Chaotic Behavior of Double Pendulum"}</strong>
                    <em>
                      {
                        "Numerically simulates double-pendulum dynamics with coupled nonlinear equations and Runge–Kutta integration."
                      }
                    </em>
                    <div className={"paper-links"}>
                      <a
                        href={
                          "https://github.com/Ehdunhackme/Chaotic-Behavior-of-Double-Pendulum"
                        }
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "A double pendulum is mechanically simple but can produce remarkably complicated motion. Because the two arms influence one another through nonlinear dynamics, a small change in the starting configuration can lead to very different trajectories. It is a compact way to explore the difference between deterministic equations and easy long-term prediction.",
                      ],
                      [
                        "Coupled motion and numerical integration",
                        "The angles and angular velocities of the two arms form a coupled system of nonlinear equations. Runge-Kutta integration advances that state through small time steps, and the resulting positions trace each mass's path. Changing the initial angles or velocities allows nearby starting states to be compared as their trajectories evolve.",
                      ],
                      [
                        "The takeaway",
                        "Deterministic equations can produce motion that is hard to predict far ahead because small initial differences grow. Numerical error can also accumulate, so smaller time steps and convergence checks help distinguish physical sensitivity from solver artifacts. The trajectories make both nonlinear coupling and the limits of long-term prediction visible.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
            {
              id: "epecscan",
              searchText:
                "2024 EPECscan A deep-learning screening model that detects EPEC bacteria and classifies their growth stage from microscopic water samples. GitHub The idea Microscopy screening requires locating individual bacteria and identifying their growth stage, often with several cells in the same image. Object detection combines those tasks: a bounding box identifies where a cell is, and its label identifies the predicted stage. Confidence scores make the output more informative than a single whole-image classification. Detection and growth-stage classification A modified YOLOv8m detector learns from annotated microscopy images to predict cell locations and growth-stage labels. Grad-CAM++ heatmaps provide a way to inspect image regions influencing predictions, while a Gradio interface supports trying new inputs. Labelled boxes and confidence scores expose the individual detections for review. The takeaway Reported evaluation scores are 0.990 mAP50 and 0.794 mAP50-95, with 70 test images processed in 13.2 seconds. The stricter overlap metric tests how precisely predicted boxes match annotations, not just whether a cell is roughly located. These results support a screening prototype on the evaluated data, not a validated clinical diagnostic system.",
              className: "paper-showcase",
              content: (
                <article className={"paper-row"}>
                  <a
                    href={"https://github.com/Ehdunhackme/EPECscan"}
                    className={"paper-thumbnail project-thumbnail"}
                    target={"_blank"}
                    rel={"noopener"}
                    aria-label={"View project: EPECscan"}
                  >
                    <Image
                      src={"/assets/project-previews/epecscan.webp"}
                      alt={"Preview of EPECscan"}
                      loading={"lazy"}
                      width={299}
                      height={298}
                      sizes="(max-width: 600px) 80px, 132px"
                    />
                  </a>
                  <div className={"paper-info"}>
                    <time className={"paper-date"}>{"2024"}</time>
                    <strong>{"EPECscan"}</strong>
                    <em>
                      {
                        "A deep-learning screening model that detects EPEC bacteria and classifies their growth stage from microscopic water samples."
                      }
                    </em>
                    <div className={"paper-links"}>
                      <a
                        href={"https://github.com/Ehdunhackme/EPECscan"}
                        target={"_blank"}
                        rel={"noopener"}
                      >
                        {"GitHub"}
                      </a>
                    </div>
                  </div>
                  <Explanation
                    sections={[
                      [
                        "The idea",
                        "Microscopy screening requires locating individual bacteria and identifying their growth stage, often with several cells in the same image. Object detection combines those tasks: a bounding box identifies where a cell is, and its label identifies the predicted stage. Confidence scores make the output more informative than a single whole-image classification.",
                      ],
                      [
                        "Detection and growth-stage classification",
                        "A modified YOLOv8m detector learns from annotated microscopy images to predict cell locations and growth-stage labels. Grad-CAM++ heatmaps provide a way to inspect image regions influencing predictions, while a Gradio interface supports trying new inputs. Labelled boxes and confidence scores expose the individual detections for review.",
                      ],
                      [
                        "The takeaway",
                        "Reported evaluation scores are 0.990 mAP50 and 0.794 mAP50-95, with 70 test images processed in 13.2 seconds. The stricter overlap metric tests how precisely predicted boxes match annotations, not just whether a cell is roughly located. These results support a screening prototype on the evaluated data, not a validated clinical diagnostic system.",
                      ],
                    ]}
                  />
                </article>
              ),
            },
          ],
        },
      ]}
    />
  );
}
