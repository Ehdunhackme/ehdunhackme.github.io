import {test, expect} from '@playwright/test';

test('architecture stages are selectable, keyboard navigable, and pause without changing the waveform', async ({page}, testInfo) => {
  await page.goto('/writings/smollertts/');
  const figure=page.getByRole('region',{name:'Animated model architecture',exact:true});
  await expect(figure).toHaveAttribute('data-step','0');
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.getByRole('heading',{name:'Text to phonemes',exact:true})).toBeVisible();
  const initialHeight=(await figure.boundingBox())!.height;
  for(const [button,heading] of [
    ['Inspect text frontend','Text to phonemes'],
    ['Inspect text encoder','Text encoder'],
    ['Inspect duration predictor','Duration & length'],
    ['Inspect length regulator','Duration & length'],
    ['Inspect prosody conditioning','Acoustic features'],
    ['Inspect acoustic decoder','Acoustic features'],
    ['Inspect mel spectrogram','Mel spectrogram'],
    ['Inspect HiFi-GAN vocoder','HiFi-GAN V2'],
    ['Inspect speech waveform','Speech waveform'],
  ]) {
    await figure.getByRole('button',{name:button,exact:true}).click();
    await expect(figure.getByRole('heading',{name:heading,exact:true})).toBeVisible();
    await expect(figure.getByRole('img',{name:`${heading} close-up`,exact:true})).toBeVisible();
    await expect(figure).toHaveAttribute('data-playing','false');
    expect(Math.abs((await figure.boundingBox())!.height-initialHeight)).toBeLessThan(1);
    const clipped=await figure.locator('svg[role="img"]').evaluate(svg=>{
      const bounds=svg.getBoundingClientRect();
      return Array.from(svg.querySelectorAll('text')).filter(text=>{
        const r=text.getBoundingClientRect();
        return r.left<bounds.left-1||r.right>bounds.right+1||r.top<bounds.top-1||r.bottom>bounds.bottom+1;
      }).map(el=>el.textContent);
    });
    expect(clipped).toEqual([]);
  }
  const regulator=figure.getByRole('button',{name:'Inspect length regulator',exact:true});
  await regulator.click();
  await regulator.press('ArrowUp');
  await expect(figure.getByRole('button',{name:'Inspect acoustic decoder',exact:true})).toBeFocused();
  await figure.getByRole('button',{name:'Inspect acoustic decoder',exact:true}).press('ArrowDown');
  await expect(regulator).toBeFocused();
  await figure.getByRole('button',{name:'Play animation',exact:true}).click();
  await expect(figure).toHaveAttribute('data-playing','true');
  await expect.poll(()=>figure.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a instanceof CSSAnimation&&a.playState==='running').length)).toBeGreaterThan(0);
  // Frames and encoded vectors stay in place while the arrows carry the motion.
  const blockPositions=()=>figure.getByRole('region',{name:'Model data flow'}).locator('rect').evaluateAll(rects=>rects.map(rect=>{
    const m=(rect as SVGGraphicsElement).getCTM()!;
    return [m.a,m.b,m.c,m.d,m.e,m.f];
  }));
  const stationary=await blockPositions();
  await page.waitForTimeout(650);
  expect(await blockPositions()).toEqual(stationary);
  await figure.getByRole('button',{name:'Pause animation',exact:true}).click();
  const frozen=()=>figure.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a instanceof CSSAnimation).map(a=>[a.currentTime,a.playState]));
  const before=await frozen();
  await page.waitForTimeout(350);
  expect(await frozen()).toEqual(before);
  await figure.getByRole('button',{name:'Inspect speech waveform',exact:true}).click();
  const waves=figure.getByRole('button',{name:'Inspect speech waveform',exact:true}).locator('line');
  const shape=await waves.evaluateAll(nodes=>nodes.map(n=>[n.getAttribute('y1'),n.getAttribute('y2')]));
  await figure.getByRole('button',{name:'Play animation',exact:true}).click();
  await page.waitForTimeout(450);
  expect(await waves.evaluateAll(nodes=>nodes.map(n=>[n.getAttribute('y1'),n.getAttribute('y2')]))).toEqual(shape);
  await regulator.click();
  await figure.screenshot({path:testInfo.outputPath('duration-closeup.png'),scale:'css'});
  await figure.getByRole('button',{name:'Inspect HiFi-GAN vocoder',exact:true}).click();
  await figure.screenshot({path:testInfo.outputPath('vocoder-closeup.png'),scale:'css'});
  await figure.getByRole('button',{name:'Inspect text frontend',exact:true}).click();
  await figure.screenshot({path:testInfo.outputPath('text-closeup.png'),scale:'css'});
  const panel=page.getByRole('group',{name:'SmollerTTS architecture',exact:true});
  const full=panel.getByRole('link',{name:'Open the full SmollerTTS architecture diagram'});
  await expect(full).toBeHidden();
  const disclosure=panel.getByText('View full architecture',{exact:true});
  await disclosure.click();
  await expect(full).toBeVisible();
  const outer=(await panel.boundingBox())!, inner=(await full.boundingBox())!;
  expect(inner.x).toBeGreaterThan(outer.x);
  expect(inner.x+inner.width).toBeLessThan(outer.x+outer.width);
  await disclosure.click();
  await expect(full).toBeHidden();
  await panel.screenshot({path:testInfo.outputPath('architecture-panel.png'),scale:'css'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
