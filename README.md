# Blackjack in React, Clever Programmer style

[Live App - cp-blaqjaq.vercel.app](cp-blaqjaq.vercel.app)

Hello CP team!

I made a couple of adjustments since concluding the presentation and demo of this app in PWR/PWJ. I'd like to highlight them here

## What has changed since then?

- Moved all styled components into one folder
- Implemented Doug's use of 'blackSuit'
- Rendering a shadow effect on top portion of background, as well as top hand to give our app some texture!
- Personalized our action buttons with some CSS and webkit modifiers (you can also customing these buttons to your liking)
- Fixed our action handlers and useEffects to eliminate many of our automated bugs (please compare all changes made in App.js)
- Squeazed our cards in hand a little closer together, and gave the faceUp cards a flipping motion via 'react-spring', which is a resouce I highly suggest for modular animations

### Future improvements

- Make the dealer not so aggressive, learn to 'push' when it makes sense so his hands are not busting so frequently. This is by far the biggest and most important objective
- Implement chip counts, doubledown and split buttons for a more realistic high-stakes game
- Working with multiple decks at a time, while showing the present stack of card to get progressively smaller as the deck gets more depleted (can be done relatively easy with react-spring)
- Always will have a need to improve styling

# _ PLEASE FORK THIS REPOSITORY TO KEEP UPDATED WITH CHANGES! _
