import {test, expect, type Locator} from '@playwright/test';

// Compare with the actual demo, at equal plot widths, so its geometry remains
// the reference when either copy changes. This also exercises both UI controls.
test('article chart matches the demo and keeps its callout clear', async ({page, context}, testInfo) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/writings/smollertts/');
  const article = page.locator('[data-benchmark-chart]');
  const plot = page.locator('[data-chart]');
  await expect(article.locator('.chart-point')).toHaveCount(85);
  const demo = await context.newPage();
  await demo.emulateMedia({reducedMotion:'reduce'});
  await demo.goto('/projects/smollertts/');
  await expect(demo.locator('.chart-point')).toHaveCount(85);
  const width = await plot.evaluate(el => el.clientWidth);
  await demo.locator('#chart').evaluate((el, width) => {el.style.width = `${width}px`;}, width);
  const read = (root: Locator) => root.evaluate(el => {
    const geometry = (value: string | null | undefined) => value?.replace(/-?\d+(?:\.\d+)?/g,n=>(+n).toFixed(4));
    return {
    frontier: geometry(el.querySelector('.frontier')?.getAttribute('d')),
    points: Array.from(el.querySelectorAll<HTMLButtonElement>('.chart-point')).map(p=>[p.dataset.id,p.style.left,p.style.top,p.getAttribute('aria-label')]),
    labels: Array.from(el.querySelectorAll('.peer-label')).map(l=>l.textContent),
    whiskers: Array.from(el.querySelectorAll('.prompt-range')).map(l=>geometry(l.getAttribute('d'))),
    callout: el.querySelector('.own-callout')?.textContent,
  };});
  const figure = page.getByRole('figure').filter({has:article});
  for (const metric of ['utmos','wer'] as const) {
    await figure.getByRole('button',{name:metric==='utmos'?'Quality UTMOS ↑':'Word errors WER ↓',exact:true}).click();
    await demo.locator(`[data-metric="${metric}"]`).click();
    for (const small of [false,true]) {
      await figure.getByRole('button',{name:small?'Under 10M':'All models',exact:true}).click();
      await demo.locator(`[data-range="${small?'small':'all'}"]`).click();
      for (const spread of [false,true]) {
        await figure.getByRole('checkbox',{name:'Show prompt range'}).setChecked(spread);
        await demo.locator('#show-spread').setChecked(spread);
        const reference = await read(demo.locator('.bench'));
        await expect.poll(()=>read(article)).toEqual(reference);
        const overlaps = await article.evaluate(el => {
          const callout=el.querySelector('.own-callout')!.getBoundingClientRect();
          return Array.from(el.querySelectorAll('.chart-point')).filter(p=> {
            const r=p.getBoundingClientRect();
            return callout.left<r.right && callout.right>r.left && callout.top<r.bottom && callout.bottom>r.top;
          }).map(p=>p.getAttribute('aria-label'));
        });
        expect(overlaps).toEqual([]);
      }
    }
  }
  await figure.getByRole('checkbox',{name:'Show prompt range'}).uncheck();
  await figure.getByRole('button',{name:'All models',exact:true}).click();
  await figure.getByRole('button',{name:'Quality UTMOS ↑',exact:true}).click();
  const own = article.locator('.chart-point.own');
  await own.focus();
  await expect(article.getByRole('tooltip')).toContainText('3.55 UTMOS');
  await expect(article.getByRole('tooltip')).toContainText('Prompts 1–4:');
  await own.press('Escape');
  await expect(article.getByRole('tooltip')).toBeHidden();
  // A screen-reader status remains, but the extra visible score strip is gone.
  await expect(figure.locator('[class*="chartReadout"]')).toHaveCount(0);
  await figure.getByRole('button',{name:'Quality UTMOS ↑',exact:true}).focus();
  await article.screenshot({path:testInfo.outputPath('benchmark.png'),scale:'css'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await demo.close();
});
