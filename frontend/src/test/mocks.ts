import { vi } from 'vitest';

export type MockAudio = Partial<HTMLAudioElement> & {
  ended: boolean;
  dispatch: (event: string) => void;
};

export const authMockState: { userId: string | null } = {
  userId: 'user-123',
};

export function resetAuthMock() {
  authMockState.userId = 'user-123';
}

export function mockShowModal() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
}

export function createMockAudio(): MockAudio {
  const listeners: Record<string, Array<() => void>> = {};

  return {
    preload: '',
    currentTime: 0,
    ended: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
    dispatch: (event: string) => {
      for (const handler of listeners[event] ?? []) handler();
    },
  };
}

export function mockAudioApi(audio: MockAudio = createMockAudio()): MockAudio {
  vi.stubGlobal(
    'Audio',
    vi.fn(function Audio() {
      return audio;
    }),
  );
  return audio;
}

export function mockDataTransfer() {
  vi.stubGlobal(
    'DataTransfer',
    class {
      items = { add: vi.fn() };
      files = {} as FileList;
    },
  );
  vi.spyOn(HTMLInputElement.prototype, 'files', 'set').mockImplementation(
    () => {},
  );
}
