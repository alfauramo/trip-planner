import { describe, it, expect } from 'vitest';
import { queryClient, persister } from '../../lib/queryClient';

describe('queryClient', () => {
  it('has default staleTime', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 2);
  });
});

describe('persister', () => {
  it('has persistClient method', () => {
    expect(persister.persistClient).toBeInstanceOf(Function);
  });
  it('has restoreClient method', () => {
    expect(persister.restoreClient).toBeInstanceOf(Function);
  });
  it('has removeClient method', () => {
    expect(persister.removeClient).toBeInstanceOf(Function);
  });
});
