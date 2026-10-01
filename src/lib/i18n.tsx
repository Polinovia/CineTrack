import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TitleStatus, TitleType } from '../types'

export type Lang = 'fr' | 'en'

const t = {
  'nav.myList': { fr: 'Ma liste', en: 'My list' },
  'nav.friends': { fr: 'Amis', en: 'Friends' },
  'nav.logout': { fr: 'Se déconnecter', en: 'Log out' },
  'nav.pushDenied': { fr: 'Notifications refusées ou indisponibles sur cet appareil.', en: 'Notifications denied or unavailable on this device.' },

  'login.createAccount': { fr: 'Créer un compte', en: 'Create account' },
  'login.signIn': { fr: 'Se connecter', en: 'Sign in' },
  'login.username': { fr: 'Pseudo', en: 'Username' },
  'login.usernamePlaceholder': { fr: 'Ton pseudo', en: 'Your username' },
  'login.password': { fr: 'Mot de passe', en: 'Password' },
  'login.submitRegister': { fr: 'Créer mon compte', en: 'Create my account' },
  'login.submitLogin': { fr: 'Entrer', en: 'Sign in' },
  'login.switchToLogin': { fr: 'Déjà un compte ? Se connecter', en: 'Already have an account? Sign in' },
  'login.switchToRegister': { fr: "Pas de compte ? S'inscrire", en: "No account? Sign up" },
  'login.error.locked': { fr: 'Trop de tentatives. Réessayez dans', en: 'Too many attempts. Try again in' },
  'login.error.usernameTaken': { fr: 'Ce pseudo est déjà pris.', en: 'This username is already taken.' },
  'login.error.invalidUsername': { fr: 'Pseudo : entre 2 et 20 caractères.', en: 'Username: 2 to 20 characters.' },
  'login.error.invalid': { fr: 'Pseudo ou mot de passe incorrect.', en: 'Wrong username or password.' },
  'login.error.network': { fr: 'Impossible de se connecter, réessayez.', en: 'Unable to connect, try again.' },

  'type.film': { fr: 'Film', en: 'Movie' },
  'type.serie': { fr: 'Série', en: 'Series' },
  'type.anime': { fr: 'Anime', en: 'Anime' },

  'status.a_voir': { fr: 'À voir', en: 'To watch' },
  'status.en_cours': { fr: 'En cours', en: 'Watching' },
  'status.vu': { fr: 'Vu', en: 'Watched' },

  'sort.recent': { fr: 'Récemment ajouté', en: 'Recently added' },
  'sort.title': { fr: 'Titre (A-Z)', en: 'Title (A-Z)' },
  'sort.rating': { fr: "Note (meilleure d'abord)", en: 'Rating (best first)' },

  'filter.all': { fr: 'Tous', en: 'All' },

  'titles.search': { fr: 'Rechercher un titre…', en: 'Search a title…' },
  'titles.empty': { fr: "Rien ici pour l'instant.", en: 'Nothing here yet.' },
  'titles.statusHint': { fr: 'Ton statut (clique pour changer)', en: 'Your status (click to change)' },
  'titles.delete': { fr: 'Supprimer', en: 'Delete' },
  'titles.upcoming': { fr: 'À venir', en: 'Upcoming' },

  'add.placeholder': { fr: 'Ajouter un titre…', en: 'Add a title…' },
  'add.submit': { fr: 'Ajouter', en: 'Add' },
  'add.alreadyInList': { fr: 'Ce titre est déjà dans ta liste.', en: 'This title is already in your list.' },

  'now.empty': { fr: 'Épingle un titre depuis sa fiche pour le voir ici', en: 'Pin a title from its page to see it here' },
  'now.label': { fr: 'En ce moment', en: 'Now watching' },

  'detail.trailer': { fr: '▶ Bande annonce', en: '▶ Trailer' },
  'detail.nowWatchingOn': { fr: 'Je regarde ça en ce moment', en: "I'm watching this now" },
  'detail.nowWatchingOff': { fr: 'Épingler comme "en ce moment"', en: 'Pin as "now watching"' },
  'detail.myReview': { fr: 'Mon avis', en: 'My review' },
  'detail.myScore': { fr: 'Ma note', en: 'My score' },
  'detail.commentPlaceholder': { fr: 'Un commentaire ? (optionnel)', en: 'A comment? (optional)' },
  'detail.saved': { fr: 'Enregistré ✓', en: 'Saved ✓' },
  'detail.update': { fr: 'Mettre à jour', en: 'Update' },
  'detail.rate': { fr: 'Noter', en: 'Rate' },
  'detail.filmsWatched': { fr: 'Films vus', en: 'Films watched' },
  'detail.seasonsWatched': { fr: 'Saisons vues', en: 'Seasons watched' },
  'detail.checkAll': { fr: 'Tout cocher', en: 'Check all' },
  'detail.fix': { fr: 'Corriger', en: 'Fix' },

  'friends.confirmRequest': { fr: 'Envoyer une demande d’ami à', en: 'Send a friend request to' },
  'friends.addPlaceholder': { fr: 'Ajouter un ami par pseudo…', en: 'Add a friend by username…' },
  'friends.add': { fr: 'Ajouter', en: 'Add' },
  'friends.notFound': { fr: 'Utilisateur introuvable.', en: 'User not found.' },
  'friends.cannotSelf': { fr: "Tu ne peux pas t'ajouter toi-même.", en: "You can't add yourself." },
  'friends.alreadySent': { fr: 'Demande déjà envoyée.', en: 'Request already sent.' },
  'friends.error': { fr: 'Erreur, réessaie.', en: 'Error, try again.' },
  'friends.pending': { fr: 'Demandes en attente', en: 'Pending requests' },
  'friends.accept': { fr: 'Accepter', en: 'Accept' },
  'friends.reject': { fr: 'Refuser', en: 'Decline' },
  'friends.myFriends': { fr: 'Mes amis', en: 'My friends' },
  'friends.remove': { fr: 'Retirer', en: 'Remove' },
  'friends.empty': { fr: "Pas encore d'amis. Ajoute quelqu'un par son pseudo !", en: 'No friends yet. Add someone by username!' },
  'friends.alreadyYours': { fr: 'Ce titre est déjà dans ta liste.', en: 'This title is already in your list.' },
  'friends.copyError': { fr: 'Erreur lors de la copie.', en: 'Error copying the title.' },
  'friends.addToList': { fr: '+ Ma liste', en: '+ My list' },

  'friendList.back': { fr: '← Retour', en: '← Back' },
  'friendList.search': { fr: 'Rechercher…', en: 'Search…' },
  'friendList.loading': { fr: 'Chargement…', en: 'Loading…' },
  'friendList.empty': { fr: 'Aucun titre.', en: 'No titles.' },

  'nav.settings': { fr: 'Paramètres', en: 'Settings' },
  'nav.notifications': { fr: 'Notifications', en: 'Notifications' },
  'settings.title': { fr: 'Paramètres', en: 'Settings' },
  'settings.back': { fr: '← Retour', en: '← Back' },
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.pushNotifications': { fr: 'Notifications push', en: 'Push notifications' },
  'settings.pushOn': { fr: 'Activées', en: 'Enabled' },
  'settings.pushOff': { fr: 'Désactivées', en: 'Disabled' },
  'settings.account': { fr: 'Compte', en: 'Account' },
  'settings.loggedAs': { fr: 'Connecté en tant que', en: 'Logged in as' },
  'settings.changePassword': { fr: 'Changer le mot de passe', en: 'Change password' },
  'settings.currentPwd': { fr: 'Mot de passe actuel', en: 'Current password' },
  'settings.newPwd': { fr: 'Nouveau mot de passe', en: 'New password' },
  'settings.changePwdBtn': { fr: 'Changer', en: 'Change' },
  'settings.pwdSuccess': { fr: 'Mot de passe changé avec succès.', en: 'Password changed successfully.' },
  'settings.pwdWrong': { fr: 'Mot de passe actuel incorrect.', en: 'Current password is incorrect.' },
  'settings.pwdMin': { fr: 'Minimum', en: 'Minimum' },
  'notif.title': { fr: 'Notifications', en: 'Notifications' },
  'notif.new': { fr: 'Nouvelles', en: 'New' },
  'notif.earlier': { fr: 'Plus anciennes', en: 'Earlier' },
  'notif.empty': { fr: 'Aucune notification.', en: 'No notifications.' },
  'notif.markAllRead': { fr: 'Tout marquer comme lu', en: 'Mark all as read' },
  'notif.friendRequest': { fr: 'vous a envoyé une demande d’ami.', en: 'sent you a friend request.' },
  'notif.friendAccepted': { fr: 'a accepté votre demande d’ami.', en: 'accepted your friend request.' },
  'notif.titleAdded': { fr: 'a ajouté', en: 'added' },
  'notif.toTheirList': { fr: 'à sa liste.', en: 'to their list.' },
  'notif.back': { fr: '← Retour', en: '← Back' },
} as const

export type TKey = keyof typeof t

type I18nCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey) => string
  typeLabel: (type: TitleType) => string
  statusLabel: (status: TitleStatus) => string
}

const I18nContext = createContext<I18nCtx>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem('mw-lang')
      if (v === 'en' || v === 'fr') return v
    } catch {}
    return 'fr'
  })

  function setLang(l: Lang) {
    setLangState(l)
    try { localStorage.setItem('mw-lang', l) } catch {}
  }

  function translate(key: TKey): string {
    return t[key]?.[lang] ?? key
  }

  function typeLabel(type: TitleType): string {
    return translate(`type.${type}` as TKey)
  }

  function statusLabel(status: TitleStatus): string {
    return translate(`status.${status}` as TKey)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate, typeLabel, statusLabel }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
