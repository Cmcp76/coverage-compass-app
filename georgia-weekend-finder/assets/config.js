// Site settings you'll edit when launching. No build step needed: change a
// value, commit, and the host redeploys.
export const SITE = {
  name: 'Georgia Weekend Finder',
  url: 'https://georgiaweekendfinder.com', // your live domain (used for share links)
  contactEmail: 'hello@georgiaweekendfinder.com',

  // ---- Google AdSense ----------------------------------------------------
  // 1. Get approved at https://adsense.google.com
  // 2. Put your publisher ID below (looks like "ca-pub-1234567890123456")
  //    and set enabled: true.
  // 3. Create ad units in AdSense and paste each unit's data-ad-slot number
  //    into `slots`. Leave a slot "" to use Auto ads only.
  // 4. Copy ads.txt.example to ads.txt with your publisher ID.
  adsense: {
    enabled: false,
    client: '', // 'ca-pub-XXXXXXXXXXXXXXXX'
    slots: {
      top: '',      // banner under the filters
      inFeed: '',   // between event cards
      sidebar: '',  // beside the submission form
    },
    inFeedEvery: 8, // show an in-feed ad after every N events
  },

  // ---- Event submission form --------------------------------------------
  // 'netlify'   : free Netlify Forms (works automatically when hosted on Netlify)
  // 'formspree' : set formspreeId (e.g. "xayzabcd") from https://formspree.io
  // 'email'     : opens the visitor's email app addressed to contactEmail
  submissions: {
    provider: 'netlify',
    formspreeId: '',
  },
}
