// A lightweight line illustration that follows the site's colours.
export function KualaLumpurSkyline() {
  return (
    <div className="kl-skyline" aria-hidden="true">
      <svg
        viewBox="0 0 1600 380"
        fill="none"
        focusable="false"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <pattern
            id="kl-windows"
            width="10"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M3 3v5m4-5v5"
              stroke="currentColor"
              strokeWidth="0.7"
              opacity="0.45"
            />
          </pattern>
          <g id="kl-twin-tower" stroke="currentColor" strokeLinejoin="round">
            <path
              d="M-30 352V172h4v-28h5v-25h5v-17h6V87h6V72h8v15h6v15h6v17h5v25h5v28h4v180Z"
              fill="var(--bg)"
            />
            <path
              d="M0 38v34m-3-15h6m-7 15h8m-8 7h8m-10 8h12m-16 8h20m-25 8h30m-30 8h30m-36 8h42m-42 8h42m-42 8h42m-47 9h52m-52 8h52m-52 8h52m-52 8h52m-56 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60"
              strokeWidth="0.8"
            />
            <path
              d="M-20 172v180m10-233v233M0 87v265m10-233v233m10-180v180"
              opacity="0.5"
              strokeWidth="0.8"
            />
            <path
              d="M-34 184h68m-68 32h68m-68 32h68m-68 32h68m-68 32h68"
              strokeWidth="1.5"
            />
            <path d="M-32 174v177m64-177v177" opacity="0.35" />
          </g>
        </defs>
        <g
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* The distant ridgeline and a quieter second layer of the city. */}
          <path
            opacity="0.24"
            d="M-15 265c54-8 72-30 112-27s50 21 83 12 48-32 84-25 41 20 78 10 63-27 100-17 50 24 86 15m528 19c45-9 68-36 110-30s55 28 92 17 51-31 96-23 54 34 96 23 86-18 165 8"
          />
          <g opacity="0.32">
            <path d="M0 354v-69h43v69m-25-69v-18h37v87m19 0V248h28v106m17 0v-77h45v77m19 0V231h36v123m18 0v-90h50v90m26 0V206h36v148m14 0V259h39v95m29 0V235h53v119m32 0V205h31v149m40 0V240h45v114m32 0V222h32v132m57 0V259h46v95m22 0V223h46v131m58 0V249h24v105m40 0V243h59v111m18 0V219h31v135m125 0V232h43v122m28 0V210h52v144m26 0V248h40v106m20 0v-69h37v69m26 0V241h48v113m22 0V265h42v89m25 0V226h29v128m18 0v-75h71v75" />
            <path d="M74 268h28m81-15h36m94-24h36m87 26h53m32-28h31m99 17h32m136 12h46m241-11h43m28-9h52m86 36h37m26-19h48m107-6h29" />
          </g>
          {/* Merdeka 118: the slender spire and folded glass faces. */}
          <g>
            <path
              d="M564 354V153l18-39 29-43 18 58 8 36 8 189Z"
              fill="var(--bg)"
            />
            <path
              d="M611 71V13M582 114l29 240m-47-201 81 201m-34-283 3 283m15-225-15 225m-42-219 65 30-73 73 77 40-77 76"
              opacity="0.72"
            />
            <path
              d="m568 169 70 3m-70 13 70 3m-70 13 71 3m-71 13 72 3m-72 13 73 3m-73 13 74 3m-74 13 75 3m-75 13 76 3m-76 13 76 3m-76 13 77 3m-77 13 77 3m-77 13 78 3"
              opacity="0.32"
              strokeWidth="0.7"
            />
            <path d="M567 155v197m81-1-9-185" opacity="0.25" />
          </g>
          {/* KL Tower: antenna, observation deck, and tapering concrete shaft. */}
          <g>
            <path d="m763 354 7-159h13l7 159Z" fill="var(--bg)" />
            <path d="M776 62v62m-3-32h6m-5 12h4m-3 12h2m-4 8v10m6-10v10" />
            <path
              d="M770 136v-6h13v6l21 6v9l-6 5v15l-15 20h-13l-15-20v-15l-6-5v-9Z"
              fill="var(--bg)"
            />
            <path
              d="M749 142q27-7 55 0m-55 9q27 6 55 0m-49 5q21 5 43 0m-43 15q21 6 43 0m-43-26v7m7-8v9m7-9v10m8-10v10m7-10v10m7-10v9m7-9v8m-28 19 6 20m7-20-5 20m-2 4v159m-6-111h13m-15 62h17"
              opacity="0.65"
            />
            <path d="M745 143q29-9 62 0m-45 212 7-159" opacity="0.25" />
          </g>
          {/* The Petronas Twin Towers and their two-level skybridge. */}
          <use href="#kl-twin-tower" x="918" y="0" />
          <use href="#kl-twin-tower" x="1012" y="0" />
          <path d="M948 222h34v9h-34Z" fill="var(--bg)" />
          <path d="M948 226h34m-34 27 17-22 17 22m-17-22v-9m-11 0v9m22-9v9" />
          {/* A low foreground of shophouses, roofs, and the old clock tower. */}
          <g fill="var(--bg)">
            <path d="M-12 380v-58l34-12 34 12v58m0 0v-83h60v83m0 0v-54l28-15 28 15v54m0 0v-72h48v72m0 0v-47l23-12 23 12v47m0 0v-69h56v69m0 0v-40h46v40" />
            <path d="M350 380v-56h30v-15h23v-30h9v-30h11v-15q0-11 10-18 10 7 10 18v15h11v30h9v30h23v15h30v56Z" />
            <path d="M522 380v-64h44v64m0 0v-32h43v32m0 0v-56h46v56m0 0v-88l29-9 29 9v88m0 0v-53h42v53m0 0v-35h54v35m0 0v-65h44v65m0 0v-38h48v38m0 0v-31h57v31m0 0v-47h42v47m0 0v-69h45v69m0 0v-32h48v32m0 0v-53h38v53m0 0v-73h65v73m0 0v-34h44v34m0 0v-59h48v59m0 0v-47h40v47m0 0v-75h58v75m0 0v-51h45v51m0 0v-64h73v64" />
          </g>
          <g opacity="0.55" strokeWidth="0.85">
            <path d="M-10 331h65m1-27h60m0 30h56m0-19h48m46 3h56m33 14h25m106 0h30M412 254h42m-42 25h42m-51 30h60m-83 15h106m-136 18h166m-109 38v-25q0-11 9-11t9 11v25m7 0v-25q0-11 9-11t9 11v25m-86 0v-22q0-10 8-10t8 10v22m101 0v-22q0-10 8-10t8 10v22" />
            <circle cx="433" cy="268" r="7" />
            <path d="M433 263v5l4 2m0-62v9m-3-9h6M533 325h23m-23 13h23m-23 13h23m-23 13h23m93-32h-30m30 13h-30m30 13h-30m47-56h42m-42 14h42m-42 14h42m-42 14h42m-42 14h42m56-3h39m17-30h30m-30 14h30m-30 14h30m104-11h27m-27 12h27m28-34h28m-28 12h28m-28 12h28m-28 12h28m100-18h24m30-13h48m-48 13h48m-48 13h48m-48 13h48m70-29h31m-31 13h31m-31 13h31m67-46h42m-42 13h42m-42 13h42m-42 13h42m66-28h55m-55 13h55m-55 13h55" />
            <path
              d="M65 311v65m14-65v65m14-65v65m14-65v65m73-55v54m14-54v54m14-54v54m65-51v51m14-51v51m14-51v51m14-51v51m355-76v77m14-77v77m14-77v77m453-62v62m15-62v62m15-62v62m15-62v62"
              opacity="0.48"
            />
          </g>
          {/* Small leafy silhouettes break up the roofline. */}
          <g fill="var(--bg)" opacity="0.8">
            <path d="M216 379v-13c-17 0-21-11-12-18-4-12 7-20 17-15 7-13 24-4 22 7 13 6 10 24-7 24v15m-11-1v-24m-6 4 6 7 8-12" />
            <path d="M507 379v-17c-14 1-21-11-13-19-4-10 7-18 16-13 8-12 22-4 20 8 15 6 10 22-6 23v18m-9-1v-29m-6 6 6 9 8-13" />
            <path d="M1220 380v-17c-13 0-19-11-11-19-3-12 10-18 18-11 8-10 20-2 18 8 13 8 5 23-9 21v18m-8-1v-27m-7 4 7 9 7-11" />
          </g>
          <path d="M-10 378h1620" opacity="0.22" />
        </g>
      </svg>
    </div>
  );
}
