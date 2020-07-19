# Splisher
A micropub client.

## To-Do

- [x] Set up infrastructure with a welcome page
- [ ] IndieAuth spec compliance
    - [ ] Authorization
        - [x] Basic usage with a sample `create` scope
        - [ ] Complete all requirements as laid out by the spec
- [ ] Micropub spec compliance
    - [ ] [Query server for configuration](https://www.w3.org/TR/micropub/#configuration)
    - [ ] [Syndication targets](https://www.w3.org/TR/micropub/#syndication-targets)
- [ ] General resilience tasks
    - [ ] Use a logging library like `winston`
        - [ ] Set up with a transport such as [timber.io](https://timber.io)
- [ ] [Types of posts](https://indieweb.org/posts#Types_of_Posts) to be supported:
    - [ ] 📄 [Article](https://indieweb.org/article)
    - [ ] 📔 [Note](https://indieweb.org/note)
    - [ ] ↪ [Reply](https://indieweb.org/reply)
    - [ ] ♥ [Like](https://indieweb.org/like)
    - [ ] ♺ [Repost](https://indieweb.org/repost)
    - [ ] 🔖 [Bookmark](https://indieweb.org/bookmark)
    - [ ] 📷 [Photo](https://indieweb.org/photo)
    - [ ] 🎥 [Video](https://indieweb.org/video)
    - [ ] 🎤 [Audio](https://indieweb.org/audio)
    - [ ] 🚩 [Checkin](https://indieweb.org/checkin)
    - [ ] 📅 [Event](https://indieweb.org/event)
    - [ ] ↪ [Reply with RSVP](https://indieweb.org/rsvp)
- [ ] For each post type
    - [ ] Create
    - [ ] Delete
    - [ ] Update
- [ ] Micropub extensions
    - [ ] [Query for supported post types](https://indieweb.org/Micropub-extensions#Query_for_Supported_Vocabulary)
    - [ ] [Slug](https://indieweb.org/Micropub-extensions#Slug)
    - [ ] [Query for category/tag list](https://indieweb.org/Micropub-extensions#Query_for_Category.2FTag_List)

## Usage

* `git clone git@github.com:hirusi/splisher.git`
* `heroku apps:create [name]`
* `git push heroku master`

## Local Development

The Dockerfile is designed to only run on Linux hosts -- it uses a bind mount.

* `git clone git@github.com:hirusi/splisher.git && cd splisher`
* `docker-compose build`
* `nvm use && npm install` - Install packages locally for now. This will not be required in the future, if and when I figure out how `node_modules` need to work in a Docker environment. PRs welcome.
* `docker-compose up`
* ~~`docker container exec splisher_web_1 npm install`~~