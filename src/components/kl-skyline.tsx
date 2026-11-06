// Original architectural linework: a composed KL panorama, not a street map.
const towerFloors = Array.from({ length: 28 }, (_, index) => 173 + index * 8);

function PetronasTower({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path
        d="M-37 420V273h4v-35h5v-29h5v-24h5v-19h6v-15h6v-12h12v12h6v15h6v19h5v24h5v29h5v35h4v147Z"
        fill="var(--bg)"
      />
      <path d="M0 80v39m-3 4h6m-7 5h8m-9 6h10m-8 5v-14l3-6 3 6v14" />
      <g strokeWidth="0.7" opacity="0.52">
        {towerFloors.map((y) => {
          const half =
            y < 185 ? 17 : y < 209 ? 22 : y < 238 ? 27 : y < 273 ? 32 : 37;
          return <path key={y} d={`M${-half} ${y}q${half} 3 ${half * 2} 0`} />;
        })}
        <path d="M-26 239v181m9-234v234m10-268v268m14-268v268m10-234v234m9-181v181" />
      </g>
      <path
        d="M-19 185q19 4 38 0m-43 24q24 4 48 0m-53 29q29 4 58 0m-63 35q34 4 68 0m-72 41q38 4 76 0m-76 47q38 4 76 0"
        strokeWidth="1.4"
      />
      <path d="M-12 166q12 3 24 0m-18-15h12" opacity="0.7" />
    </g>
  );
}

export function KualaLumpurSkyline() {
  return (
    <div className="kl-skyline" aria-hidden="true">
      <svg
        viewBox="0 0 1600 420"
        fill="none"
        focusable="false"
        preserveAspectRatio="xMidYMax meet"
      >
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* A quiet, uneven backdrop with varied roof heights and setbacks. */}
          <g strokeWidth="0.85" opacity="0.22">
            <path d="M-15 420V346h44v-20h29v94m0-57h33v-52h49v109m0-70h32v-65h43v135m0-83h23v-29h58v112m0-111h29v-35h47v146m0-65h29v-30h39v95m0-109h23v-55h46v164m39 0V301h51v119m18 0V320h32v-65h39v165m0-111h30v-24h44v135m0-110h36v-54h33v164m53 0V321h29v-31h50v130m52 0V291h40v129m93 0V292h36v-38h48v166m0-91h39v-37h45v128m0-102h27v-46h43v148m0-88h31v-29h56v117m0-72h42v-17h55v89" />
            <path d="M91 319h49m32-26h43m63 24h47m47 47h29m29-85h23m130-16h39m44 57h44m36-46h33m165 48h40m132-38h48m129 18h43m31 39h56" />
          </g>

          {/* Distinct middle-distance masses, with only selected facade detail. */}
          <g strokeWidth="1.05" strokeOpacity="0.43" fill="var(--bg)">
            <path d="M24 420V350l54-11 20 9v72Zm54-81v81m-54-62 54-11 20 9" />
            <path d="M113 420V318h17v-9h47v9h9v102Zm17-111v111m-17-91h73" />
            <path d="M227 420V306l42-8 22 11v111Zm42-122v122m-42-105 42-8 22 11" />
            <path d="M329 420V255h47v-12h23v177Zm47-165v165m-47-156h47" />
            <path d="M420 420V318h34v-22h41v124Zm34-102v102" />
            <path d="M590 420V281l47-8 21 11v136Zm47-147v147m-47-131 47-8 21 11" />
            <path d="M687 420V322h20v-17h44v115Zm20-115v115" />
            <path d="M814 420V276h35v-13h27v157Zm35-144v144m-35-134h35" />
            <path d="M1101 420V274l57-10 22 12v144Zm57-156v156m-57-137 57-10 22 12" />
            <path d="M1224 420V307h12v-28h29v-9h17v9h13v141Zm12-113h59m-30-28v141" />
            <path d="M1337 420V323l48-10 23 13v94Zm48-107v107m-48-89 48-10 23 13" />
            <path d="M1463 420V302h55v11h24v107Zm55-107v107m-55-102h55" />
          </g>
          <g strokeWidth="0.65" opacity="0.23">
            <path d="M34 368v43m11-45v45m11-47v47m10-49v49m75-82v82m12-82v82m12-82v82m174-135h27m-27 15h27m-27 15h27m-27 15h27m-27 15h27m-27 15h27m-27 15h27m-27 15h27M600 302l26-4m-26 18 26-4m-26 18 26-4m-26 18 26-4m-26 18 26-4m-26 18 26-4m-26 18 26-4m-26 18 26-4M823 302h17m-17 18h17m-17 18h17m-17 18h17m-17 18h17m-17 18h17M1112 297l34-6m-34 21 34-6m-34 21 34-6m-34 21 34-6m-34 21 34-6m-34 21 34-6m-34 21 34-6M1473 331h35m-35 20h35m-35 20h35m-35 20h35" />
          </g>

          {/* Merdeka 118: straight spire, offset crown, and broad glass facets. */}
          <g strokeWidth="1.45">
            <path
              d="M503 420 505 150 500 119 541 108 553 124 558 258 553 420Z"
              fill="var(--bg)"
            />
            <path d="M541 108V18m-3 91 3-65 3 65M500 119l33 8 20-3m-48 26 28-23-17 141 42-10-26 162m-29 0 13-152 37 152m-20-293 9 132" />
            <path
              d="m508 153 8 115-6 150m29-288 9 126-10 163m-29-154 40-6m-43 62 47-7"
              strokeWidth="0.65"
              opacity="0.42"
            />
            <path
              d="m505 149 7 3m-6 35 8 1m-7 35 8 1m35-64 4-1m-2 39 3-1m-2 39 3-1m-50 76 9-1m-10 42 8-1m-9 41 7-1"
              strokeWidth="0.8"
              opacity="0.65"
            />
          </g>

          {/* Menara KL: slender shaft and rounded, stacked observation decks. */}
          <g strokeWidth="1.35">
            <path d="M765 420 772 260h12l7 160Z" fill="var(--bg)" />
            <path d="M778 117v78m-3-56h6m-6 18h6m-6 18h6m-7 20h8v11h-8Z" />
            <path
              d="M750 216q28-15 56 0l-3 15-8 17-10 12h-14l-10-12-8-17Z"
              fill="var(--bg)"
            />
            <path
              d="M750 216q28 9 56 0m-54 7q26 9 52 0m-50 7q24 9 48 0m-45 7q21 8 42 0m-38 7q17 7 34 0m-30 7q13 5 26 0m-17 9v160"
              strokeWidth="0.85"
            />
            <path
              d="M758 213v10m8-13v15m8-16v17m8-17v17m8-16v15m8-12v10m-27 86h14m-16 58h18"
              strokeWidth="0.7"
              opacity="0.46"
            />
          </g>

          {/* Petronas floor rings follow the setbacks; the bridge has supports. */}
          <g strokeWidth="1.3">
            <PetronasTower x={958} />
            <PetronasTower x={1062} />
            <path d="M991 282h38v10h-38Z" fill="var(--bg)" />
            <path
              d="M991 287h38m-38 31 19-26 19 26m-19-26v-10"
              strokeWidth="1.1"
            />
            <path d="M1001 283v8m18-8v8" strokeWidth="0.7" />
          </g>

          {/* Exchange 106's square lantern crown balances the eastern cluster. */}
          <g strokeWidth="1.05" strokeOpacity="0.55">
            <path d="M1376 420V226h7v-24h38v24h7v194Z" fill="var(--bg)" />
            <path d="M1383 202v-11h38v11m-38 24h38m-45 12h52m-45-36v218m38-218v218m-32-218v24m7-24v24m7-24v24m7-24v24" />
            <path
              d="M1393 242v178m9-178v178m9-178v178m-29-158h40m-40 24h40m-40 24h40m-40 24h40m-40 24h40m-40 24h40"
              strokeWidth="0.55"
              opacity="0.5"
            />
          </g>

          {/* Foreground: shophouse roofs and the old civic clock tower. */}
          <g strokeWidth="1.1" fill="var(--bg)">
            <path d="M-12 420v-38l44-10 37 10v38m0 0v-53l56 1 18 9v43m0 0v-35l31-8 31 8v35m0 0v-49h43v49m0 0v-35h45v35" />
            <path d="M282 420v-48h22v-10h30v-34h11v-17h6v-13q0-11 11-17 11 6 11 17v13h6v17h11v34h30v10h22v48Z" />
            <path d="M442 420v-37l36-9 32 9v37m0 0v-34h54v34m0 0v-55l49-5 23 10v50m0 0v-29h35v29m0 0v-61h47v61m0 0v-28h40v28m0 0v-44l38-7 22 9v42m0 0v-21h37v21m0 0v-49l44-8 31 10v47m0 0v-33h58v33m0 0v-60h38v60m0 0v-31h51v31m0 0v-46l27-7 35 7v46m0 0v-28h42v28m0 0v-52h49v52m0 0v-36l38-9 31 9v36m0 0v-55h47v55m0 0v-30h55v30m0 0v-49h57v49" />
          </g>
          <g strokeWidth="0.75" opacity="0.65">
            <path d="M-10 389h78m8-15h49l11 6m-60-6v46m49-46v46m-42-37h15m-15 12h15m10-12h10m-10 12h10M282 381h160m-160 16h160m-108-35h56m-45-34h34m-34-17h34m-17-39v10m-4-10h8" />
            <circle cx="362" cy="342" r="9" />
            <path d="M362 336v7l5 2m-70 75v-27q0-8 7-8t7 8v27m10 0v-27q0-8 7-8t7 8v27m13 0v-25q0-11 14-14 14 3 14 14v25m13 0v-27q0-8 7-8t7 8v27m10 0v-27q0-8 7-8t7 8v27M451 391l27-7 22 6m-47 8v22m13-25v25m13-28v28m14-24v24M575 374l38-5 13 6m-13-6v51m-36-30h26m-26 12h26m80-34h31m-31 13h31m-31 13h31m-31 13h31M879 382l32-6 22 6m-22-6v44m-31-27h22m-22 13h22M1075 399h28m-28 11h28m94-28h32m-32 13h32m-32 13h32m98-27h30m-30 14h30m-30 14h30" />
          </g>
          {/* Individual tree canopies soften the architectural edge. */}
          <g strokeWidth="0.9" strokeOpacity="0.54" fill="var(--bg)">
            <path d="M221 420v-13c-12 2-17-7-13-14-5-8 1-16 10-15 4-9 16-9 20-1 10-3 17 5 13 13 9 7 2 18-11 17v13m-10 0v-23m-6-3 6 8 7-10" />
            <path d="M647 420v-12c-12 0-17-10-10-17-4-8 6-14 13-11 8-8 19-2 18 7 11 5 9 17-6 20v13m-8-1v-23m-5 1 5 8 5-10" />
            <path d="M1150 420v-15c-13 0-19-8-14-16-5-9 3-17 13-15 6-10 19-7 23 2 12-2 17 9 11 16 5 9-3 15-16 13v15m-8 0v-27m-7 0 7 11 8-15" />
          </g>
        </g>
      </svg>
    </div>
  );
}
