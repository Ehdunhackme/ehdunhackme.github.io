(function () {
  'use strict';

  // Prewritten explanations, grounded in the papers and project READMEs.
  // The byline is display metadata; this static page makes no model/API calls.
  var modelCredit = 'Generated with GPT-6.1 Sol';
  var entries = {
    'platonic-representation': {
      url: 'https://arxiv.org/abs/2610.04130',
      sections: [
        ['The idea', 'Two models can arrange galaxies similarly in their internal representations without encoding the same useful physics. Think of two maps that group the same cities together but disagree about their actual distances. The paper separates geometric agreement from scientific usefulness: if representations really are interchangeable, a predictor trained on one survey should work when transferred to another.'],
        ['What the paper does', 'It examines representations throughout 36 pretrained models using matched optical images, infrared images, and spectra. Across 139 model-survey comparisons, it measures how similarly models organize the same astronomical objects. It then compares layer selection based on geometric alignment with selection based on the physical properties being predicted, and tests cross-survey transfer.'],
        ['The takeaway', 'Local alignment appears somewhere in every comparison, but it does not generally grow with depth. Geometry-selected stages underperform label-selected stages in the image-transfer tests, and aligned final representations can still fail at redshift transfer. Shared geometry is therefore not a shortcut for demonstrating shared scientific information in these experiments; the target prediction task still needs to be tested.']
      ]
    },
    'perturbation-robustness': {
      url: 'https://arxiv.org/abs/2609.03322',
      sections: [
        ['The idea', 'A typo and a shuffled sentence can both confuse a language model, yet they may disturb different parts of its computation. Looking only at the final answer hides that distinction. The paper asks how an input change travels through the model, connecting outward behavior with the geometry of hidden representations and the roles of attention heads.'],
        ['What the paper does', 'It studies six perturbations, including character edits, token substitutions, and shuffling, at three levels: output behavior, layerwise representations, and attention-head function. Behavioral tests cover four GPT-2 and two Qwen2.5 checkpoints, while the head-level analysis focuses on GPT-2. It also compares gradient-guided HotFlip edits with random substitutions at matched edit rates.'],
        ['The takeaway', 'Different perturbations leave different internal signatures that output metrics alone do not capture. HotFlip is more disruptive than matched random edits in the tested settings. Because patterns are only partly consistent across checkpoints, the practical lesson is to evaluate robustness using several complementary measurements, rather than treating one output score or representation metric as a complete picture.']
      ]
    },
    'nonlinear-queries': {
      sections: [
        ['The idea', 'Attention uses queries to decide which information to retrieve. A learned linear query projection can be partly redundant with surrounding transformations: it may change coordinates without adding a genuinely new function. A nonlinear query pathway can break that symmetry, offering a way to spend a similar parameter budget on a richer computation instead.'],
        ['What the paper does', 'The supplied manuscript replaces the query projection with a nonlinear residual bottleneck network and compares it with linear-query baselines at matched parameter counts. It develops the motivation through a change-of-basis argument and reports language-model experiments across the scales tested. Learning-rate schedules are varied to examine how the observed gains depend on the training setup.'],
        ['The takeaway', 'The reported 124M-model experiments improve validation log-loss by roughly 0.3% to 2.4%, depending on the schedule. This makes nonlinear attention projections a promising small architectural change to investigate further, rather than an established universal improvement. The supplied version is titled "Beyond Linearity in Attention Projections"; the card retains the existing project title.']
      ]
    },
    'latent-safety-probes': {
      url: 'https://arxiv.org/abs/2608.08029',
      sections: [
        ['The idea', 'Instead of running another large guard model, could a small classifier detect harmful prompts by reading a language model\'s own internal activations? This paper revisits an earlier probing result and asks whether it survives reproduction, changes of model family, and repeated activation extraction. The aim is to test the reliability of the method, not just obtain a strong score once.'],
        ['What the paper does', 'It recreates the final-layer, last-token probing pipeline and trains classifiers on activations from additional open-weight backbones, including Gemma, Mistral, and Qwen models. Evaluation covers WildJailbreak, BeaverTails, and AEGIS 2.0. Repeating extraction under multiple random seeds checks whether the representations used by the probe change under the tested conditions.'],
        ['The takeaway', 'The original LLaMA benchmark F1 scores are reproduced within 0.37 percentage points, and the method extends to the additional model families studied. Final-token representations remain unchanged across the tested extraction seeds in this setup. These results support further study of lightweight safety probes, while keeping the claim specific to benchmark harm detection rather than guaranteed deployment safety.']
      ]
    },
    'symbolic-music-genres': {
      sections: [
        ['The idea', 'Real music collections contain far more examples of some genres than others. A classifier can look accurate overall while doing poorly on rare genres, so the paper focuses on how evenly it recognizes different classes. Working with MIDI also means learning from musical events and structure rather than from an audio recording.'],
        ['What the paper does', 'It represents MIDI files as 128-dimensional graph-based embeddings and studies an 11-genre classification task using a human-annotated ground-truth set. The comparison includes a vanilla baseline, class-sensitive learning, SMOTE oversampling, and several undersampling strategies. Genre-balanced metrics, including macro recall and worst-class recall, make performance on minority genres visible.'],
        ['The takeaway', 'SMOTE oversampling with logistic regression gives the strongest genre-balanced results among the tested methods. The resulting approach assigns predicted genre labels to over three million MIDI files, expanding the resources available for symbolic-music research. The large collection is automatically labelled, not manually annotated at that scale, and the results emphasize why overall accuracy alone can be misleading.']
      ]
    },
    'anthropogenic-vlm': {
      url: 'https://arxiv.org/abs/2604.11490',
      sections: [
        ['The idea', 'A model can score well on global benchmarks while missing the objects, language, or cultural context that matter in a particular region. Regional adaptation aims to improve that local relevance without erasing broad capabilities. The paper treats regional usefulness and global generalization as goals that should be evaluated together, rather than assuming one will automatically preserve the other.'],
        ['What the paper does', 'The GG-EZ method combines regional data filtering with model merging. Using Southeast Asia as a case study, the authors test the approach across large vision-language models, text-to-image models, and vision-language embedding models. The experiments track both cultural-relevance metrics and performance on broader global evaluations.'],
        ['The takeaway', 'The paper reports 5-15% gains on its Southeast Asian cultural-relevance metrics while retaining over 98% of measured global performance. It offers a practical baseline for adapting multimodal models to an underrepresented region. Those improvements refer to the selected datasets and benchmarks, so evaluation in the intended local use case remains an important part of applying the method.']
      ]
    },
    'low-resource-translation': {
      url: 'https://arxiv.org/abs/2603.16660',
      sections: [
        ['The idea', 'When examples in a rare language are scarce, a better-resourced related language might provide a useful bridge. The paper asks whether that bridge can help through the prompt alone, avoiding the data and compute requirements of fine-tuning. It tests the intuition that linguistic similarity is useful guidance, rather than assuming that any related language will help.'],
        ['What the paper does', 'It combines linguistically related pivot languages with a few translation demonstrations in the prompt, without updating the model parameters. Controlled low-resource translation experiments examine when pivot-based guidance improves results and how the construction of the few-shot examples affects those results. This isolates a lightweight inference-time adaptation strategy.'],
        ['The takeaway', 'Pivot-based prompting can help in some configurations, especially when the target language is poorly represented in the model vocabulary. The gains are often modest and sensitive to example choice; closely related or better-represented varieties can show inconsistent benefits. The useful outcome is guidance on when to try the approach, not a claim that linguistic relatedness always improves translation.']
      ]
    },
    'symbolic-piano-continuation': {
      url: 'https://arxiv.org/abs/2509.12267',
      sections: [
        ['The idea', 'For a narrow task, a small model with suitable data and a straightforward training objective may compete with a much larger general-purpose system. Here the task is continuing a short piano passage coherently, rather than generating every kind of music. The approach brings next-token prediction back to tokenized MIDI without adding an elaborate control mechanism.'],
        ['What the paper does', 'It trains a roughly 20-million-parameter RWKV-7 model on MIDI sequences using a next-token prediction objective. Given a four-measure piano prompt, the system generates a twelve-measure continuation. The MIREX evaluation compares selected generations through listener ratings of coherence, structure, creativity, and musicality against other entries and much larger baselines.'],
        ['The takeaway', 'The small model is competitive with the much larger Anticipatory baseline on the reported musical-quality ratings. This supports investing in task-focused data and training fundamentals, not just parameter count. The evidence comes from a constrained single-instrument task and a small listening study with team-selected samples, so it is a focused result rather than a general ranking of music models.']
      ]
    },
    'platonic-universe-acknowledgement': {
      url: 'https://arxiv.org/abs/2509.19453',
      sections: [
        ['The idea', 'Do models trained on different data learn a shared picture of the same physical universe? Astronomy provides an external reference: the same galaxy can be observed with different telescopes and through different modalities, while physical properties provide a way to judge what the representations actually capture. This makes it possible to compare similarity with scientific usefulness.'],
        ['What the paper does', 'The linked v2 manuscript compares eleven foundation-model families on matched telescope images and spectra while keeping their weights frozen. It probes properties such as redshift and stellar mass and measures both local neighborhood similarity and global representation geometry. The comparison spans different architectures, training approaches, and model capacities.'],
        ['The takeaway', 'The paper finds that capacity predicts physical-property performance and that local alignment tracks that performance better than global geometric alignment in the studied comparisons. It motivates astronomy as a testbed for representation learning and the reuse of general-purpose pretrained models. My contribution here was acknowledged discussions and comments, not authorship; this entry remains in the separate Acknowledgements section.']
      ]
    },
    'beamline-straggling': {
      kind: 'project',
      url: 'https://github.com/bunchofcellulose/bl4s2026',
      image: { file: 'beamline-straggling.png', width: 488, height: 366 },
      sections: [
        ['The idea', 'A particle beam changes as it passes through matter. The proposed experiment explores whether the distribution of small angular deflections can help investigate a material\'s energy-dependent complex permittivity. Simulation provides a way to study particle interactions and prepare an analysis workflow before attempting a beam experiment.'],
        ['What the project does', 'The repository implements a Geant4 particle-interaction simulation with interactive visualization and batch-running workflows. Simulation output can be saved in ROOT files for inspection and analysis. The preview shows angular distributions for the different material-thickness settings provided in the project image.'],
        ['The takeaway', 'The project connects a physics proposal with the practical tools needed to simulate events, collect outputs, and examine distributions. It is an experimental proposal and simulation workflow, not a claim that a beam measurement has already established the material properties. The proposal and code links provide the relevant context for interpreting the plotted results.']
      ]
    },
    'magnetic-ring': {
      kind: 'project',
      url: 'https://github.com/Ehdunhackme/Magnetic-Field-of-Cylindrical-Axially-Magnetized-Ring',
      image: { file: 'magnetic-ring.png', width: 341, height: 356 },
      sections: [
        ['The idea', 'A ring magnet produces a spatially varying field that is easier to understand when its direction and strength are visible together. Rather than replacing the ring with a single point source, this project builds a numerical picture by adding the contributions of many small current elements.'],
        ['What the project does', 'It applies the Biot-Savart law across a grid in the x-y plane and visualizes the resulting vector field and field-strength heatmap. The repository also explores sensitivity to small spatial perturbations. The supplied image shows how field directions vary around and within the ring geometry.'],
        ['The takeaway', 'The simulation turns a mathematical field calculation into a visual object that can be inspected and compared across positions. It is also a useful example of the cost of brute-force numerical summation: finer grids and more current elements improve resolution but increase computation. Sensitivity plots describe spatial changes in this model, not automatically chaotic dynamics.']
      ]
    },
    'double-pendulum': {
      kind: 'project',
      url: 'https://github.com/Ehdunhackme/Chaotic-Behavior-of-Double-Pendulum',
      image: { file: 'double-pendulum.png', width: 364, height: 375 },
      sections: [
        ['The idea', 'A double pendulum is mechanically simple but can produce remarkably complicated motion. Because the two arms influence one another through nonlinear dynamics, a small change in the starting configuration can lead to very different trajectories. It is a compact way to explore the difference between deterministic equations and easy long-term prediction.'],
        ['What the project does', 'The Python simulation represents the two arms through coupled equations of motion and uses Runge-Kutta integration to approximate their evolution over time. It visualizes the moving pendulum and its trajectories, translating the mathematical model into the looping paths shown in the preview.'],
        ['The takeaway', 'The project makes nonlinear motion tangible and provides a setting for experimenting with initial conditions and numerical integration. The resulting paths illustrate the behavior of the chosen model and solver; checking the time step and numerical error matters when interpreting a long simulation or comparing two nearby starting states.']
      ]
    },
    'epecscan': {
      kind: 'project',
      url: 'https://github.com/Ehdunhackme/EPECscan',
      image: { file: 'epecscan.png', width: 299, height: 298 },
      sections: [
        ['The idea', 'Microscopy screening involves finding individual bacteria in an image and identifying their growth stage. EPECscan explores whether an object-detection model can help with both tasks, making the detections visible as labelled boxes rather than producing only a single classification for the whole image.'],
        ['What the project does', 'The project uses a modified YOLOv8m detector trained on annotated microscopy images. Its README describes growth-stage labels, Grad-CAM++ decision heatmaps, and a Gradio interface for trying the model. The supplied preview shows detected objects with stage labels and confidence scores.'],
        ['The takeaway', 'The repository reports mAP50 of 0.990 and mAP50-95 of 0.794 on its evaluation, with 70 test images processed in 13.2 seconds. It demonstrates an image-screening research prototype with inspectable outputs, not a validated clinical diagnostic system; those results should be understood in the context of the reported dataset and testing setup.']
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
      : 'paper-previews/' + id + '.png', assetBase).href;
    image.alt = (entry.kind === 'project' ? 'Preview of ' : 'First page of ') + title.textContent;
    image.width = entry.image ? entry.image.width : 480;
    image.height = entry.image ? entry.image.height : (tallPages.indexOf(id) === -1 ? 622 : 679);
    image.loading = 'eager';
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
  });
})();
