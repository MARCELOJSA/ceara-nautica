import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';

export function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="location">{`${loc.pathname}${loc.search}`}</output>;
}

export function renderAt(
  ui: ReactElement,
  { route = '/', path = '*' }: { route?: string; path?: string } = {},
) {
  return render(
    <HelmetProvider>
      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="always">
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route
                path={path}
                element={
                  <>
                    {ui}
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </MotionConfig>
      </LazyMotion>
    </HelmetProvider>,
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
