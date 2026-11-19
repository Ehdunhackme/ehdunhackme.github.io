import {test, expect} from '@playwright/test';

test('demo shares the interactive architecture with a readable light theme', async ({page}, testInfo) => {
  const errors: string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/projects/smollertts/');
  const figure=page.getByRole('region',{name:'Animated model architecture',exact:true});
  const panel=page.getByRole('group',{name:'SmollerTTS architecture',exact:true});
  await expect(figure).toHaveAttribute('data-theme','light');
  await figure.scrollIntoViewIfNeeded();
  await figure.getByRole('button',{name:'Inspect text frontend',exact:true}).click();
  await expect(figure.getByRole('heading',{name:'Text to phonemes',exact:true})).toBeVisible();
  await expect(figure).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(figure.locator('.sm-arch-closeupArrow')).toHaveCSS('color','rgb(51, 51, 51)');
  for(const [button,heading] of [
    ['Inspect text encoder','Text encoder'],
    ['Inspect length regulator','Duration & length'],
    ['Inspect acoustic decoder','Acoustic features'],
    ['Inspect mel spectrogram','Mel spectrogram'],
    ['Inspect HiFi-GAN vocoder','HiFi-GAN V2'],
    ['Inspect speech waveform','Speech waveform'],
  ]) {
    await figure.getByRole('button',{name:button,exact:true}).click();
    await expect(figure.getByRole('heading',{name:heading,exact:true})).toBeVisible();
    const clipped=await figure.locator('svg[role="img"]').evaluate(svg=>{
      const box=svg.getBoundingClientRect();
      return [...svg.querySelectorAll('text')].filter(text=>{
        const b=text.getBoundingClientRect();
        return b.left<box.left-1||b.right>box.right+1||b.top<box.top-1||b.bottom>box.bottom+1;
      }).map(text=>text.textContent);
    });
    expect(clipped).toEqual([]);
  }
  await figure.getByRole('button',{name:'Inspect length regulator',exact:true}).click();
  await figure.getByRole('button',{name:'Play animation',exact:true}).click();
  await expect(figure).toHaveAttribute('data-step','3',{timeout:6500});
  await figure.getByRole('button',{name:'Pause animation',exact:true}).click();
  await expect(figure).toHaveAttribute('data-playing','false');
  await figure.getByRole('button',{name:'Inspect text frontend',exact:true}).click();
  await panel.screenshot({path:testInfo.outputPath('demo-animation.png'),scale:'css'});
  const full=panel.locator('#architecture-diagram');
  await expect(full).toBeHidden();
  await panel.getByText('View full architecture',{exact:true}).click();
  await expect(full.locator('svg')).toBeVisible();
  await panel.locator('details').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
  const panelBox=(await panel.boundingBox())!, fullBox=(await full.boundingBox())!;
  expect(fullBox.y).toBeGreaterThan(panelBox.y);
  expect(fullBox.y+fullBox.height).toBeLessThanOrEqual(panelBox.y+panelBox.height);
  await panel.getByText('View full architecture',{exact:true}).click();
  await expect(full).toBeHidden();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  expect(overflow).toBe(false);
  // The independent diagram must not interfere with the editor or benchmark.
  await expect(page.locator('#generate')).toBeEnabled();
  await expect(page.locator('#chart')).toBeVisible();
  expect(errors).toEqual([]);
});
