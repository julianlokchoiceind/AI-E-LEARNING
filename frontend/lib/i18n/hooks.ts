/**
 * i18n custom hooks
 */

import { useI18n } from './context';

/**
 * Hook for navigation translations
 */
export function useNavigationTranslations() {
  const { t } = useI18n();

  const navItems = {
    home: t('nav.home'),
    courses: t('nav.courses'),
    about: t('nav.about'),
    contact: t('nav.contact'),
    faq: t('nav.faq'),
    pricing: t('nav.pricing'),
    dashboard: t('nav.dashboard'),
    myCourses: t('nav.myCourses'),
    certificates: t('nav.certificates'),
    profile: t('nav.profile'),
    settings: t('nav.settings'),
  };

  return { navItems, t };
}
