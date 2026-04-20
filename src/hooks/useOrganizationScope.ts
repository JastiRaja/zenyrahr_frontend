import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { isMainPlatformAdmin } from '../types/auth';

export type OrganizationOption = { id: number; name: string };

/**
 * Resolves organizationId for tenant-scoped API calls. Organization users use their login org;
 * platform admins must pick a tenant (defaults to first organization from the directory).
 */
export function useOrganizationScope() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(
    user?.organizationId ?? null
  );

  useEffect(() => {
    setSelectedOrganizationId(user?.organizationId ?? null);
  }, [user?.organizationId]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.organizationId != null) {
      return;
    }
    if (!isMainPlatformAdmin(user.role)) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/organizations');
        const list = Array.isArray(res.data) ? res.data : [];
        if (cancelled) {
          return;
        }
        setOrganizations(
          list.map((o: { id: number; name: string }) => ({ id: o.id, name: o.name }))
        );
        setSelectedOrganizationId((prev) => prev ?? (list[0]?.id ?? null));
      } catch {
        if (!cancelled) {
          setOrganizations([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.organizationId]);

  const needsOrganizationSelection =
    user != null && user.organizationId == null && isMainPlatformAdmin(user.role);

  return {
    organizationId: selectedOrganizationId,
    setSelectedOrganizationId,
    organizations,
    needsOrganizationSelection,
  };
}
