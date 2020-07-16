# Splisher
A micropub client.

## To-Do

- [x] Set up infrastructure with a welcome page
- [x] Set up IndieLogin
    - [ ] Request registration of client ID once in production
- [ ] Use a logging library
- [ ] [Types of posts](https://indieweb.org/posts#Types_of_Posts) to be supported
    - [ ] Article
    - [ ] Note
    - [ ] Like
    - [ ] Reply
    - [ ] Bookmark
    - [ ] Repost
    - [ ] Photo
- [ ] Signal syndication targets
- [ ] Tag suggestions while creating a post
- [ ] For each post type
    - [ ] Create
    - [ ] Delete
    - [ ] Update

## Usage

* `git clone git@github.com:hirusi/splisher.git`
* `heroku apps:create [name]`
* `git push heroku master`

## Local Development

The Dockerfile is designed to only run on Linux hosts -- it uses a bind mount.

* `git clone git@github.com:hirusi/splisher.git && cd splisher`
* `docker-compose build`
* `docker-compose up`
* `docker container exec splisher_web_1 npm install`