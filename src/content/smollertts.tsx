import Link from "next/link";
import { renderToString } from "katex";
import "katex/dist/katex.min.css";
import { BenchmarkFigure, LiveDemo } from "./smollertts-interactive";
import { ArchitectureAnimation } from "./smollertts-architecture";
import { ArticleDisclosure } from "./article-disclosure";
import data from "./smollertts-data.json";
import styles from "./smollertts.module.css";
import {ArrowIcon} from './smollertts-icons';
import {ResourceLink} from '@/components/resource-link';

const repo = "https://github.com/Ehdunhackme/SmollerTTS";
const snapshot = `${repo}/blob/6db1e7bf3a997a050c106c83e3375484bbd1f9b9`;
const assets = "/assets/writings/smollertts";

function Equation({latex, label}: {latex: string; label: string}) {
  return <div className={styles.equation} role="group" aria-label={label} dangerouslySetInnerHTML={{__html: renderToString(latex, {displayMode: true, throwOnError: true, trust: false, output: 'htmlAndMathml'})}} />;
}

export function SmollerArticle() {
  return (
    <main className="page writing-page">
      <article className={`page-shell writing-post-shell writing-content ${styles.article}`}>
        <header className={styles.header}>
          <h1>SmollerTTS, a <span className={styles.keepTogether}>2.81M-parameter</span> English TTS model</h1>
          <div className={styles.headerBottom}>
            <div className={styles.meta}><time dateTime="2026-11-19">19 Nov 2026</time><span>Dun Li Chan</span></div>
            <nav className={styles.resources} aria-label="SmollerTTS resources">
              <ResourceLink href="/projects/smollertts/">Demo</ResourceLink>
              <ResourceLink href={repo}>GitHub</ResourceLink>
              <ResourceLink href="https://huggingface.co/dunli5107/SmollerTTS">Hugging Face</ResourceLink>
              <ResourceLink href={`${repo}/blob/main/docs/training.md`}>Training code</ResourceLink>
            </nav>
          </div>
        </header>

        <p className={styles.lead}>SmollerTTS is a 2.81M-parameter English voice that runs on your browser’s CPU. The weights take up 11.34 MB. Try it below.</p>

        <LiveDemo />

        <h2 id="starting-small">Starting small</h2>
        <p>I originally wanted a model under a million parameters that spoke several languages. The early versions sounded robotic and skipped words. I kept changing things, but it was hard to tell whether pronunciation, the acoustic model or the waveform decoder was responsible.</p>
        <p>I narrowed it to one English speaker and a pretrained HiFi-GAN V2 vocoder. That made debugging easier. I could compare audio reconstructed from a real recording with audio made from my model’s predictions. The vocoder was the same in both, so the difference pointed back to the acoustic model.</p>
        <p>The result is my own 1.88M-parameter acoustic network, trained from scratch on LJSpeech, paired with a 0.93M-parameter vocoder. Both run locally; your text stays on your device.</p>

        <h2 id="architecture">From text to a waveform</h2>
        <p>Text becomes phonemes, the model predicts their timing and acoustic features, and the vocoder turns those features into audio. Each chunk of speech is predicted in parallel.</p>
        <div className={styles.architecturePanel} role="group" aria-label="SmollerTTS architecture">
          <ArchitectureAnimation peaks={data.samples[0].peaks} />

        <ArticleDisclosure summary="View full architecture" className={`${styles.disclosure} ${styles.architectureDisclosure}`}>
            <figure className={styles.architecture}>
              <a href={`${assets}/architecture-dark.svg`} target="_blank" rel="noopener noreferrer" aria-label="Open the full SmollerTTS architecture diagram">
                {/* A local SVG preserves the small layer labels when readers zoom in. */}
                <img src={`${assets}/architecture-dark.svg`} width="1000" height="890" alt="SmollerTTS architecture: four text encoder blocks feed duration prediction and length regulation, six frame blocks predict 80 mel bands, and a HiFi-GAN V2 vocoder produces a 22.05 kHz waveform." loading="lazy" />
              </a>
            </figure>
        </ArticleDisclosure>
        </div>

        <h3>Text and pronunciation</h3>
        <p>The frontend expands dates, times and money into words before converting them to phonemes. “$12.99” needs a spoken reading such as “twelve dollars and ninety-nine cents.” Stress markers tell the model which syllables should receive emphasis.</p>
        <p>This was one place where an apparently simple fix backfired. Splitting difficult words into familiar pieces helped some examples but made ordinary words worse. The current frontend keeps dictionary pronunciations, only splits tested compounds automatically, and lets you supply an explicit pronunciation when needed.</p>

        <h3>Timing and acoustic features</h3>
        <p>Phoneme and stress embeddings are summed at a width of 160, with positional encoding added. Four encoder blocks combine four-head self-attention, depthwise convolutions and small feed-forward layers. Attention gives each phone context from the sentence; the convolutions capture local patterns.</p>
        <p>A duration head predicts how many frames each phone should occupy. The length regulator repeats the N encoded phones in H by their predicted durations, giving T audio frames in total. A position signal within each phone lets its beginning and ending sound different.</p>
        <Equation label="Length regulation" latex={String.raw`\widetilde{H}=\operatorname{LR}(H,\widehat{d}), \qquad T=\sum_{i=1}^{N}\widehat{d}_i`} />
        <p>Six convolutional frame blocks then predict an 80-band mel spectrogram, a compact description of how sound energy changes over time. Pitch, voicing and energy predictions condition this stage. The acoustic network contains <strong>1,882,807 parameters</strong>.</p>
        <p>Each frame block uses a depthwise convolution to mix nearby frames, followed by two linear layers that expand the features from 160 to 320 channels and bring them back to 160.</p>
        <Equation label="Compact frame decoder block" latex={String.raw`\begin{aligned}U&=\operatorname{LN}\!\left(\operatorname{DWConv}(X)\right),\\V&=W_2\!\left(\operatorname{GELU}\!\left(W_1(U)\right)\right),\\X_{\mathrm{out}}&=X+\alpha\odot V.\end{aligned}`} />
        <p>Here, <var>X</var> is the input frame sequence, LN is layer normalization, and <var>W₁</var> and <var>W₂</var> are learned linear layers including their biases. The learned channel-wise scale <var>α</var> controls how much the block adds to its input. Padding masks are omitted from the equation.</p>

        <h3>The waveform decoder</h3>
        <p>The frozen <a href="https://arxiv.org/abs/2010.05646">HiFi-GAN</a> LJ_V2 generator converts those mel features into a 22,050 Hz mono waveform. Its four upsampling stages expand each frame by 8 × 8 × 2 × 2, or 256 audio samples. Residual branches with different receptive fields help model the waveform at several scales.</p>
        <p>I use the published vocoder weights, which contribute <strong>925,985 parameters</strong>. Its training discriminators are not needed for playback. Together, the acoustic model and vocoder total <strong>2,808,792 parameters</strong>.</p>
        <p>The acoustic model learns normalized mel features. Before sending its predictions to HiFi-GAN, I restore their original scale using statistics calculated from the training set.</p>
        <Equation label="Mel normalization and waveform synthesis" latex={String.raw`\begin{aligned}Z_{t,f}&=\frac{M_{t,f}-\mu_f}{\sigma_f},\\\widehat{M}_{t,f}&=\sigma_f\widehat{Z}_{t,f}+\mu_f,\\\widehat{x}&=G_{\mathrm{HiFi\text{-}GAN}}(\widehat{M}).\end{aligned}`} />
        <p><var>M</var> contains the log-mel features and <var>Z</var> their normalized values. The indices <var>t</var> and <var>f</var> identify a frame and mel band; <var>μ</var> and <var>σ</var> are the per-band training mean and standard deviation. Hats mark predictions, and <var>x̂</var> is the generated waveform.</p>

        <h2 id="training">Training the acoustic model</h2>
        <p>I used <a href="https://keithito.com/LJ-Speech-Dataset/">LJSpeech</a>, roughly 24 hours of recordings from one English speaker. The released run used 12,134 accepted training clips, about 22.12 hours, with separate development recordings and reserved test IDs. A single speaker kept the voice consistent without needing a speaker-conditioning system.</p>
        <p>Forced alignment estimates where each phoneme occurs in the recordings, giving the model a duration target. WORLD extracts pitch and voicing. The preparation code computes energy and mel features, then calculates normalization statistics from training frames only.</p>
        <p>The mel features have to match what the vocoder was trained to consume. That includes the magnitude convention, frequency range, window, hop, padding and log scale. Getting the tensor shape right is not enough. I also compare the exported graphs with the Python model to catch changes introduced on the way to the browser.</p>
        <p>The acoustic model starts from random weights. The release recipe uses 10,000 updates with AdamW, complete utterances and a learning-rate warm-up. The loss combines mel reconstruction, changes between neighbouring mel frames, phoneme duration and prosody prediction. The frozen vocoder does not participate in this training loop.</p>

        <section className={styles.trainingSettings} aria-labelledby="training-settings-title">
          <h3 id="training-settings-title">Training settings</h3>
          <div className={styles.tableScroll}>
            <table className={styles.recipe}><tbody>
              <tr><th scope="row">Initialization</th><td>Random; seed 2718</td></tr>
              <tr><th scope="row">Batch</th><td>Up to 24 utterances; 12,000 padded frames</td></tr>
              <tr><th scope="row">Optimizer</th><td>AdamW; β = (0.9, 0.98); weight decay 0.01</td></tr>
              <tr><th scope="row">Learning rate</th><td>5 × 10⁻⁴ base; 300-step warm-up; 20,000-step half-life</td></tr>
              <tr><th scope="row">Mel features</th><td>80 bands; FFT 1024; hop 256; 0–8,000 Hz</td></tr>
              <tr><th scope="row">Precision</th><td>FP32; TF32 enabled on CUDA</td></tr>
            </tbody></table>
          </div>
          <Equation label="Acoustic training objective" latex={String.raw`\begin{aligned}\mathcal{L}={}&\mathcal{L}_{\mathrm{mel}}+0.5\mathcal{L}_{\Delta\mathrm{mel}}+0.5\mathcal{L}_{\mathrm{duration}}\\&+0.15\mathcal{L}_{\mathrm{frame\ prosody}}+0.1\mathcal{L}_{\mathrm{phone\ prosody}}\end{aligned}`} />
          <p>The <a href={`${snapshot}/smollertts/loss.py`}>loss</a> uses absolute error for mel reconstruction, frame-to-frame differences for the delta term, and squared error on log durations. Prosody combines pitch, energy and voicing. The full <a href={`${snapshot}/configs/acoustic.json`}>configuration</a> is in the repository.</p>
        </section>

        <p>I still want to address a mismatch between training and inference. The decoder receives recorded prosody during training and predicted prosody when generating speech. Training it to cope with its own imperfect predictions is one of the next experiments I want to run.</p>

        <h2 id="browser">Getting it into the browser</h2>
        <p>The model is exported as three FP32 ONNX graphs for the encoder, frame decoder and vocoder. JavaScript handles text processing and length regulation between them. A Web Worker runs inference on a single WebAssembly CPU thread, keeping the page responsive while audio is generated.</p>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Released model file sizes">
          <table><thead><tr><th scope="col">Graph</th><th scope="col">File size</th><th scope="col">Job</th></tr></thead><tbody>
            <tr><th scope="row">Encoder</th><td>5.00 MB</td><td>Phones, durations, coarse prosody</td></tr>
            <tr><th scope="row">Frame decoder</th><td>2.59 MB</td><td>Frame features and mel prediction</td></tr>
            <tr><th scope="row">Vocoder</th><td>3.74 MB</td><td>Mel features to waveform</td></tr>
            <tr className={styles.total}><th scope="row">Total weights</th><td>11.34 MB</td><td>2.81M parameters, FP32</td></tr>
          </tbody></table>
        </div>
        <p>Including the runtime and pronunciation files, the download is about 30 MB. The weights are FP32, with no quantization yet. I checked the exported model against the Python version to catch differences in the browser output.</p>
        <p>The full demo plays longer text in chunks, starting as soon as the first is ready. This article’s player waits for the complete output. Repeated requests can reuse cached audio.</p>

        <h2 id="results">Speech quality vs. model size (rough)</h2>
        <p>I scored SmollerTTS on the four English prompts used by <a href="https://github.com/5uck1ess/tts-bench/tree/1dd3a81a50dd21fb2f4bce89df27eada996ba57f">tts-bench</a> and added it to their published results.</p>
        <BenchmarkFigure models={data.models} />
        <p>SmollerTTS scores <strong>3.55 UTMOS</strong> and <strong>6.69% mean prompt WER</strong> here. The WER uses Whisper large-v3. Different voices, runtimes and some evaluator revisions make this a rough overview, and four sentences cannot establish a reliable ranking.</p>

        <h3>A closer comparison with tiny-voca</h3>
        <p>I also rendered a separate set of 48 prompts with SmollerTTS and two tiny-voca voices. The set covers everyday speech, narration, dialogue, numbers, technical terms and longer passages. All three voices completed every prompt.</p>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Separate 48-prompt comparison">
          <table className={styles.resultsTable}><thead><tr><th scope="col">Model / voice</th><th scope="col">Parameters</th><th scope="col">UTMOS <ArrowIcon direction="up" /></th><th scope="col">WER <ArrowIcon direction="down" /></th></tr></thead><tbody>
            {data.matched.map((row) => <tr key={row.name}><th scope="row">{row.name}{row.name === "SmollerTTS" ? " / LJ" : ""}</th><td>{row.parameters_m.toFixed(2)}M</td><td>{row.utmos.toFixed(2)}</td><td>{(row.wer * 100).toFixed(2)}%</td></tr>)}
          </tbody></table>
        </div>
        <p>This test uses Whisper small.en and corpus-level WER, so it should be read separately from the graph. I normalized time and unit formatting for all models after inspecting the transcripts; SmollerTTS scored 1.71% WER before that change. The <a href={`${snapshot}/benchmarks/matched/results.json`}>full results</a> include the details.</p>
        <p>SmollerTTS is smaller, but tiny-voca scores better on both metrics. That matches what I hear. The words are often clear, but the delivery can still sound flat. A low word error rate does not mean a voice is pleasant to listen to.</p>

        <h2 id="next">What I would improve next</h2>
        <p>Timing and prosody come first. Longer training runs and bigger decoders did not consistently help in the early experiments. I want to test changes against fixed prompts, with people listening as well as automated scores. After that, I would like to try quantization to reduce the download.</p>

        <h2 id="contributing">Try it, or help to hillclimb it</h2>
        <p>The <Link href="/projects/smollertts/">demo</Link>, <a href={repo}>source</a> and <a href="https://huggingface.co/dunli5107/SmollerTTS">weights</a> are public. The repository includes data preparation, training, checkpoint resume, listening tools and ONNX export.</p>
        <p>The <a href={`${repo}/blob/main/docs/training.md`}>training guide</a> documents how to train from random initialization. It reproduces the released architecture and recipe, but the complete accepted-recording list from the original run has not been recovered, so it does not promise identical training data selection or checkpoint bytes.</p>
        <p>If you’re interested in helping out, <a href="mailto:dunlinmy88@gmail.com">send me an email</a>, open a <a href={`${repo}/pulls`}>pull request</a>, or file an <a href={`${repo}/issues`}>issue in the repository</a>.</p>

        <section className={styles.references} aria-labelledby="references-title">
          <h2 id="references-title">References</h2>
          <ol className={styles.referenceList}>
            <li id="ref-ljspeech"><p>Keith Ito and Linda Johnson. <a href="https://keithito.com/LJ-Speech-Dataset/">The LJ Speech Dataset</a>. 2017.</p></li>
            <li id="ref-hifigan"><p>Jungil Kong, Jaehyeon Kim and Jaekyoung Bae. <a href="https://arxiv.org/abs/2010.05646">HiFi-GAN: Generative Adversarial Networks for Efficient and High Fidelity Speech Synthesis</a>. NeurIPS, 2020. <a href="https://github.com/jik876/hifi-gan">Code and pretrained weights</a>.</p></li>
            <li id="ref-utmos"><p>Takaaki Saeki, Detai Xin, Wataru Nakata, Tomoki Koriyama, Shinnosuke Takamichi and Hiroshi Saruwatari. <a href="https://arxiv.org/abs/2204.02152">UTMOS: UTokyo-SaruLab System for VoiceMOS Challenge 2022</a>. Interspeech, 2022. <a href="https://github.com/tarepan/SpeechMOS">Implementation</a>.</p></li>
            <li id="ref-bench"><p>5uck1ess and contributors. <a href="https://github.com/5uck1ess/tts-bench/tree/1dd3a81a50dd21fb2f4bce89df27eada996ba57f">tts-bench</a>. Benchmark snapshot <code>1dd3a81</code>, accessed 19 November 2026.</p></li>
          </ol>
        </section>

        <section className={styles.citation} aria-labelledby="citation-title">
          <h2 id="citation-title">Cite this post</h2>
          <pre><code>{`@misc{chan2026smollertts,
  title = {{SmollerTTS}, a 2.81M-parameter English text-to-speech model},
  author = {Chan, Dun Li},
  year = {2026},
  month = {nov},
  howpublished = {\\url{https://dunlichan.com/writings/smollertts/}},
  note = {Blog post}
}`}</code></pre>
        </section>
      </article>
    </main>
  );
}
