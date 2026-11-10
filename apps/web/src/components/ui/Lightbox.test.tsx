import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lightbox } from './Lightbox';

const IMAGES = [
  { src: '/a.webp', alt: 'Foto A' },
  { src: '/b.webp', alt: 'Foto B' },
  { src: '/c.webp', alt: 'Foto C' },
];

/** Usa onClose inline (recriado a cada render), como no ProductDetail original. */
function Harness() {
  const [i, setI] = useState<number | null>(null);
  return (
    <>
      <button type="button" onClick={() => setI(0)}>
        Ampliar
      </button>
      <Lightbox images={IMAGES} index={i} onClose={() => setI(null)} onIndexChange={setI} />
    </>
  );
}

describe('<Lightbox />', () => {
  it('trocar de foto mantém o foco no botão usado e não fecha (QA-01)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Ampliar' }));
    const next = screen.getByRole('button', { name: 'Próxima imagem' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(next).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ampliar' })).toHaveFocus();
  });

  it('arrastar para o lado troca a foto; gesto vertical não troca (UX-13)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Ampliar' }));
    const stage = screen.getByTestId('lightbox-stage');
    const swipe = (x0: number, x1: number, y0 = 300, y1 = 300) => {
      fireEvent.touchStart(stage, { touches: [{ clientX: x0, clientY: y0 }] });
      fireEvent.touchEnd(stage, { changedTouches: [{ clientX: x1, clientY: y1 }] });
    };
    swipe(300, 120);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    swipe(120, 300);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    swipe(200, 220, 100, 400);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    // o clique sintético que segue o arrasto não fecha a galeria
    swipe(300, 100);
    fireEvent.click(stage);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
