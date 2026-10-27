(function () {
  'use strict';

  // Prewritten explanations, grounded in the papers and project READMEs.
  // The byline is display metadata; this static page makes no model/API calls.
  var modelCredit = 'Generated with GPT-6.1 Sol';
  var entries = {
    'platonic-representation': {
      url: 'https://arxiv.org/abs/2610.04130',
      sections: [
        ['The idea', 'Two models can group the same galaxies similarly without encoding the same useful physics. Nearby points in representation space may reflect shared visual features rather than redshift or other physical properties. Genuine interchangeability requires more than similar geometry: a predictor trained on one survey should also remain useful when transferred to another.'],
        ['Layerwise alignment and transfer', 'Matched optical images, infrared images, and spectra provide a common set of astronomical objects for comparing 36 pretrained models. Across 139 model-survey comparisons, neighborhood alignment measures agreement at different depths. Cross-survey prediction then compares layers chosen for geometric similarity with layers chosen for their ability to predict the target physical property.'],
        ['The takeaway', 'Local alignment appears somewhere in every comparison, but does not generally increase with depth. Geometry-selected layers underperform label-selected layers in the image-transfer tests, and aligned final representations can still fail at redshift transfer. Similar neighborhoods therefore do not establish shared physical information; direct prediction and transfer tests remain necessary.']
      ]
    },
    'perturbation-robustness': {
      url: 'https://arxiv.org/abs/2609.03322',
      sections: [
        ['The idea', 'A typo changes the form of individual words, while shuffling changes their order and context. Both can hurt predictions, but the disruption can begin at different depths and affect different attention functions. Tracking the path from altered input to hidden states to output reveals distinctions that a final accuracy or loss score misses.'],
        ['Tracing disruption through the model', 'Six perturbations, including character edits, token substitutions, and shuffling, are evaluated through output behavior, layerwise representations, and attention-head function. Behavioral comparisons span four GPT-2 and two Qwen2.5 checkpoints; head-level analysis focuses on GPT-2. Gradient-guided HotFlip substitutions are compared with random substitutions at the same edit rate to separate targeted disruption from the amount of corruption.'],
        ['The takeaway', 'Different perturbations leave different internal signatures, and HotFlip is more disruptive than matched random edits in the tested settings. Patterns are only partly consistent across checkpoints. Robustness is therefore better understood through complementary behavioral and internal measurements than through a single output score or representation metric.']
      ]
    },
    'nonlinear-queries': {
      sections: [
        ['The idea', 'Attention uses queries to decide which information to retrieve. A learned linear query projection can be partly redundant with surrounding transformations: it may change coordinates without adding a genuinely new function. A nonlinear query pathway can break that symmetry, offering a way to spend a similar parameter budget on a richer computation instead.'],
        ['Nonlinear query projections', 'A residual bottleneck network replaces the usual linear query projection, adding a nonlinear transformation before attention scores are computed. Matched-parameter linear baselines help isolate the effect of the query function rather than extra model capacity. Varying the learning-rate schedule tests how much of the benefit depends on the optimization setup.'],
        ['The takeaway', 'In the reported 124M-model experiments, validation log-loss improves by roughly 0.3% to 2.4%, depending on the learning-rate schedule. A small change to the query pathway can therefore improve how a fixed parameter budget is used. The schedule dependence also makes training configuration an important part of evaluating the architecture.']
      ]
    },
    'latent-safety-probes': {
      url: 'https://arxiv.org/abs/2608.08029',
      sections: [
        ['The idea', 'A language model\'s internal activations can contain information about whether a prompt is harmful. A small classifier, or probe, can read those activations instead of requiring a separate large guard model. The key question is whether this signal remains useful across model families and reproducible across repeated activation extraction.'],
        ['Probing final-token activations', 'Final-layer activations at the last token become features for harm classifiers. Reproducing the LLaMA setup and extending the pipeline to Gemma, Mistral, and Qwen tests portability across open-weight backbones. WildJailbreak, BeaverTails, and AEGIS 2.0 provide evaluation data, while repeated extraction with different random seeds checks feature stability.'],
        ['The takeaway', 'The original LLaMA benchmark F1 scores are reproduced within 0.37 percentage points, with useful results on the additional model families. Final-token representations remain unchanged across the tested extraction seeds. Lightweight probes can capture benchmark harm signals reliably in this setup, although classifying harmful prompts is narrower than establishing deployment safety.']
      ]
    },
    'symbolic-music-genres': {
      sections: [
        ['The idea', 'Music collections contain many examples of popular genres and far fewer of rare ones. A classifier can achieve high overall accuracy by favoring the common classes while barely recognizing the rest. Genre-balanced evaluation makes those failures visible, using the musical events and structure in MIDI rather than recorded audio.'],
        ['Graph embeddings and class balancing', 'Each MIDI file is represented by a 128-dimensional graph-based embedding for an 11-genre classification task. A human-annotated ground-truth set supports comparisons between an unbalanced baseline, class-sensitive learning, SMOTE oversampling, and undersampling strategies. Macro recall weights genres equally, while worst-class recall highlights the weakest-performing genre.'],
        ['The takeaway', 'SMOTE oversampling with logistic regression gives the strongest genre-balanced results among the tested methods. Applying the classifier produces predicted genre labels for over three million MIDI files. These automatic labels expand symbolic-music resources, while the balanced metrics show why strong aggregate accuracy need not mean reliable recognition of rare genres.']
      ]
    },
    'anthropogenic-vlm': {
      url: 'https://arxiv.org/abs/2604.11490',
      sections: [
        ['The idea', 'Strong global benchmark scores can hide weak understanding of a region\'s objects, language, and cultural context. Regional adaptation should improve local relevance without erasing broader capabilities. That requires measuring both goals together rather than assuming that better regional performance automatically preserves global performance.'],
        ['Regional filtering and model merging', 'GG-EZ combines regional data filtering with model merging, using Southeast Asia as the adaptation setting. Comparisons cover large vision-language models, text-to-image models, and vision-language embedding models. Regional cultural-relevance metrics measure the local benefit, while broader evaluations track how much general capability is retained.'],
        ['The takeaway', 'Southeast Asian cultural-relevance metrics improve by 5-15% while over 98% of measured global performance is retained. Regional filtering and merging can therefore improve local usefulness without a large measured global trade-off. The size of that benefit remains tied to the selected datasets and evaluations.']
      ]
    },
    'low-resource-translation': {
      url: 'https://arxiv.org/abs/2603.16660',
      sections: [
        ['The idea', 'A better-resourced related language can act as a bridge when translation examples in a target language are scarce. Shared linguistic structure may help connect an unfamiliar expression to patterns the model already knows. Supplying that bridge in the prompt offers an inference-time alternative to collecting enough data for fine-tuning.'],
        ['Pivot-language prompting', 'Translation prompts combine a linguistically related pivot language with a small number of demonstrations, leaving model parameters unchanged. Controlled comparisons vary the guidance and construction of the few-shot examples to identify when the bridge helps. This separates the effect of prompt design from improvements that would require additional training.'],
        ['The takeaway', 'Pivot-based prompting helps in some configurations, especially when the target language is poorly represented in the model vocabulary. Gains are often modest and sensitive to example choice; closely related or better-represented varieties can benefit inconsistently. Linguistic relatedness is therefore a useful starting point for prompt design, not a guarantee of better translation.']
      ]
    },
    'symbolic-piano-continuation': {
      url: 'https://arxiv.org/abs/2509.12267',
      sections: [
        ['The idea', 'For a narrow task, a small model with suitable data and a straightforward training objective may compete with a much larger general-purpose system. Here the task is continuing a short piano passage coherently, rather than generating every kind of music. The approach brings next-token prediction back to tokenized MIDI without adding an elaborate control mechanism.'],
        ['Next-token piano continuation', 'A roughly 20-million-parameter RWKV-7 model learns next-token prediction over MIDI sequences. A four-measure piano prompt conditions a twelve-measure continuation, allowing the generated passage to be judged against its musical starting point. MIREX listener ratings compare selected generations on coherence, structure, creativity, and musicality against other entries and much larger baselines.'],
        ['The takeaway', 'The small model is competitive with the much larger Anticipatory baseline on the reported musical-quality ratings. Task-focused data and a straightforward objective can matter as much as scale for this constrained piano task. The comparison uses a small listening study with team-selected samples, rather than an unrestricted evaluation of all generated music.']
      ]
    },
    'platonic-universe-acknowledgement': {
      url: 'https://arxiv.org/abs/2509.19453',
      sections: [
        ['The idea', 'Do models trained on different data learn a shared picture of the same physical universe? Astronomy provides an external reference: the same galaxy can be observed with different telescopes and through different modalities, while physical properties provide a way to judge what the representations actually capture. This makes it possible to compare similarity with scientific usefulness.'],
        ['Frozen representations and physical properties', 'Matched telescope images and spectra allow comparisons across eleven foundation-model families without changing their weights. Probes test how well the frozen representations encode redshift, stellar mass, and other physical properties. Local neighborhood similarity and global geometric alignment provide two different ways to compare representations across architectures, training approaches, and capacities.'],
        ['The takeaway', 'Model capacity predicts physical-property performance, while local alignment tracks that performance better than global geometric alignment in the studied comparisons. Observations of the same physical objects create a useful testbed for distinguishing shared representation structure from information that supports scientific prediction.']
      ]
    },
    'beamline-straggling': {
      kind: 'project',
      url: 'https://github.com/bunchofcellulose/bl4s2026',
      image: { file: 'beamline-straggling.webp', width: 488, height: 366 },
      sections: [
        ['The idea', 'Protons passing through tungsten undergo many small deflections, producing a spread of outgoing angles called angular straggling. That spread contains information about the underlying collisions. Connecting the scattering cross section to the Fermi-Virtual Photon model offers a proposed route to estimating energy-dependent complex permittivity: the real and imaginary parts describing a material\'s electromagnetic response.'],
        ['From scattering angles to permittivity', 'Upstream and downstream wire-chamber pairs reconstruct incoming and outgoing proton tracks, while Cherenkov detectors support particle identification. Removing the baseline beam spread by deconvolution isolates the target\'s contribution. A Poisson-weighted multiple-scattering model then estimates a single-collision cross section; a relativistic angle-to-energy transformation and numerical inversion of the FVP relation connect it to permittivity. Geant4 simulations support the angular-distribution analysis.'],
        ['The takeaway', 'Angular measurements provide an indirect route from visible track deflections to a material\'s microscopic response. Reliable inversion depends on beam-profile calibration, detector resolution, the scattering model, and enough events to constrain small angles. Current numerical simulations leave the very-small-angle cross section poorly constrained; the proposed beam measurements would supply data to test the reconstruction and FVP predictions.']
      ]
    },
    'magnetic-ring': {
      kind: 'project',
      url: 'https://github.com/Ehdunhackme/Magnetic-Field-of-Cylindrical-Axially-Magnetized-Ring',
      image: { file: 'magnetic-ring.webp', width: 341, height: 356 },
      sections: [
        ['The idea', 'A ring magnet produces a field whose direction and strength change with position. Adding the contributions of many small current elements preserves the ring geometry instead of collapsing it into a single point source. This makes the field inside the opening and around the magnet directly comparable.'],
        ['Biot-Savart field mapping', 'Numerical summation of Biot-Savart contributions gives the magnetic field at points on an x-y grid. A vector plot shows field direction, while a heatmap shows field strength. Comparing nearby sampling positions reveals how sensitive the calculated field is to small spatial changes.'],
        ['The takeaway', 'Field maps connect the ring\'s geometry to a spatial pattern that is difficult to infer from the equations alone. Finer sampling and more current elements improve numerical resolution but increase computation. Strong variation between nearby positions describes a spatial gradient; by itself, it does not establish chaotic time evolution.']
      ]
    },
    'double-pendulum': {
      kind: 'project',
      url: 'https://github.com/Ehdunhackme/Chaotic-Behavior-of-Double-Pendulum',
      image: { file: 'double-pendulum.webp', width: 364, height: 375 },
      sections: [
        ['The idea', 'A double pendulum is mechanically simple but can produce remarkably complicated motion. Because the two arms influence one another through nonlinear dynamics, a small change in the starting configuration can lead to very different trajectories. It is a compact way to explore the difference between deterministic equations and easy long-term prediction.'],
        ['Coupled motion and numerical integration', 'The angles and angular velocities of the two arms form a coupled system of nonlinear equations. Runge-Kutta integration advances that state through small time steps, and the resulting positions trace each mass\'s path. Changing the initial angles or velocities allows nearby starting states to be compared as their trajectories evolve.'],
        ['The takeaway', 'Deterministic equations can produce motion that is hard to predict far ahead because small initial differences grow. Numerical error can also accumulate, so smaller time steps and convergence checks help distinguish physical sensitivity from solver artifacts. The trajectories make both nonlinear coupling and the limits of long-term prediction visible.']
      ]
    },
    'epecscan': {
      kind: 'project',
      url: 'https://github.com/Ehdunhackme/EPECscan',
      image: { file: 'epecscan.webp', width: 299, height: 298 },
      sections: [
        ['The idea', 'Microscopy screening requires locating individual bacteria and identifying their growth stage, often with several cells in the same image. Object detection combines those tasks: a bounding box identifies where a cell is, and its label identifies the predicted stage. Confidence scores make the output more informative than a single whole-image classification.'],
        ['Detection and growth-stage classification', 'A modified YOLOv8m detector learns from annotated microscopy images to predict cell locations and growth-stage labels. Grad-CAM++ heatmaps provide a way to inspect image regions influencing predictions, while a Gradio interface supports trying new inputs. Labelled boxes and confidence scores expose the individual detections for review.'],
        ['The takeaway', 'Reported evaluation scores are 0.990 mAP50 and 0.794 mAP50-95, with 70 test images processed in 13.2 seconds. The stricter overlap metric tests how precisely predicted boxes match annotations, not just whether a cell is roughly located. These results support a screening prototype on the evaluated data, not a validated clinical diagnostic system.']
      ]
    }
  };

  var boards = document.querySelectorAll('.paper-showcase-scope');
  if (!boards.length) return;
  var assetBase = new URL('../assets/', document.currentScript.src);
  var tallPages = ['latent-safety-probes', 'symbolic-music-genres', 'low-resource-translation', 'symbolic-piano-continuation'];

  function animateExplanation(details, summary, body) {
    var heightAnimation = null;
    var fadeAnimation = null;
    var targetOpen = details.open;

    function cancelAnimations() {
      if (heightAnimation) {
        heightAnimation.onfinish = null;
        heightAnimation.cancel();
        heightAnimation = null;
      }
      if (fadeAnimation) {
        fadeAnimation.cancel();
        fadeAnimation = null;
      }
    }

    summary.addEventListener('click', function (event) {
      // Native summary clicks include Enter/Space activation. Keep the content
      // mounted while closing, then remove `open` only after it has shrunk.
      event.preventDefault();
      targetOpen = !targetOpen;
      var startHeight = details.getBoundingClientRect().height;
      var startOpacity = details.open ? window.getComputedStyle(body).opacity : '0';
      cancelAnimations();

      if (typeof details.animate !== 'function' || typeof body.animate !== 'function' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        details.open = targetOpen;
        details.classList.remove('is-animating');
        return;
      }

      details.open = true;
      var endHeight = targetOpen
        ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height;
      details.classList.add('is-animating');
      var options = { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' };
      var currentAnimation = details.animate([
        { height: startHeight + 'px' },
        { height: endHeight + 'px' }
      ], options);
      heightAnimation = currentAnimation;
      fadeAnimation = body.animate([
        { opacity: startOpacity },
        { opacity: targetOpen ? 1 : 0 }
      ], options);

      currentAnimation.onfinish = function () {
        if (heightAnimation !== currentAnimation) return;
        details.open = targetOpen;
        details.classList.remove('is-animating');
        cancelAnimations();
      };
    });

    details.addEventListener('toggle', function () {
      if (!heightAnimation) targetOpen = details.open;
    });
  }

  function enhanceEntry(board, id) {
    var item = board.querySelector('[data-paper-id="' + id + '"]') || board.querySelector('#' + id);
    if (!item || item.classList.contains('paper-showcase')) return;
    var row = item.querySelector('.paper-row');
    var info = row && row.querySelector('.paper-info');
    var links = row && row.querySelector('.paper-links');
    var title = info && info.querySelector('strong');
    if (!row || !info || !title) return;
    var entry = entries[id];
    var fallbackLink = links && links.querySelector('a:last-child');
    var sourceLink = entry.url || (fallbackLink && fallbackLink.href);
    if (!sourceLink) return;

    item.classList.add('paper-showcase');
    var thumbnail = document.createElement('a');
    thumbnail.className = 'paper-thumbnail';
    if (entry.kind === 'project') thumbnail.classList.add('project-thumbnail');
    thumbnail.href = sourceLink;
    thumbnail.target = '_blank';
    thumbnail.rel = 'noopener';
    thumbnail.setAttribute('aria-label', (entry.kind === 'project' ? 'View project: ' : 'Read paper: ') + title.textContent);
    var image = document.createElement('img');
    image.src = new URL(entry.image
      ? 'project-previews/' + entry.image.file
      : 'paper-previews/' + id + '.webp', assetBase).href;
    image.alt = (entry.kind === 'project' ? 'Preview of ' : 'First page of ') + title.textContent;
    image.width = entry.image ? entry.image.width : 480;
    image.height = entry.image ? entry.image.height : (tallPages.indexOf(id) === -1 ? 622 : 679);
    image.loading = 'lazy';
    image.decoding = 'async';
    image.fetchPriority = 'low';
    thumbnail.appendChild(image);
    row.insertBefore(thumbnail, info);
    var date = row.querySelector('.paper-date');
    if (date && date.parentElement !== info) info.insertBefore(date, info.firstChild);
    if (links) info.appendChild(links);

    var explanation = document.createElement('details');
    explanation.className = 'paper-explanation';
    var summary = document.createElement('summary');
    summary.textContent = 'LLM-generated explanation';
    explanation.appendChild(summary);
    var body = document.createElement('div');
    body.className = 'paper-explanation-body';
    var description = document.createElement('dl');
    entry.sections.forEach(function (section) {
      var term = document.createElement('dt');
      var definition = document.createElement('dd');
      term.textContent = section[0];
      definition.textContent = section[1];
      description.appendChild(term);
      description.appendChild(definition);
    });
    body.appendChild(description);
    var note = document.createElement('p');
    note.className = 'paper-explanation-note';
    note.textContent = modelCredit;
    body.appendChild(note);
    explanation.appendChild(body);
    row.appendChild(explanation);
    animateExplanation(explanation, summary, body);
  }

  boards.forEach(function (board) {
    Object.keys(entries).forEach(function (id) { enhanceEntry(board, id); });
    board.dispatchEvent(new Event('directory-content-ready'));
  });
})();
