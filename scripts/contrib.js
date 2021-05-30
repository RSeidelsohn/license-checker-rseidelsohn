#!/usr/bin/env node

const join = require('path').join;
const format = require('format-package-json');
const GitContributors = require('git-contributors').GitContributors;
const opts = join(__dirname, '../');
const pkg = join(__dirname, '../package.json');
const json = require(pkg);

json.contributors = [
    'Adam Weber <adamweber01@gmail.com>',
    'Andrew Couch <andy@couchand.com>',
    'Asharma <Asharma@agtinternational.com>',
    'Bryan English <bryan@bryanenglish.com>',
    'Christoph Werner <christoph@codepunkt.de>',
    'Cory Reed <creed@mrn.org>',
    'Damien Larmine <damien.larmine@gmail.com>',
    'Dan Rumney <dancrumb@gmail.com>',
    'Dav Glass <davglass@gmail.com>',
    'Dick Wiggers <dickje@gmail.com>',
    'Drew Folta <drew@folta.net>',
    'Elijah Insua <tmpvar@gmail.com>',
    'Francois Zaninotto <fzaninotto@gmail.com>',
    'Glen Arrowsmith <glen.arrowsmith@gmail.com>',
    'Helio Frota <00hf11@gmail.com>',
    'Holger Knust <holger.knust@certusview.com>',
    'Honza Javorek <mail@honzajavorek.cz>',
    'Ivan Latunov <ivan.latunov@chaosgroup.com>',
    'James Bloomer <github2@thebloomers.co.uk>',
    'Jonny Reeves <john.reeves@improbable.io>',
    'Jonny Reeves <jonny@improbable.io>',
    'Ladislav Prskavec <abtris@Ladislavs-MacBook-Pro.local>',
    'Ladislav Prskavec <ladislav@prskavec.net>',
    'Lorenzo Cesana <cesana.lorenzo@gmail.com>',
    'Mark Tse <mark.tse@d2l.com>',
    'Mark Tse <neverendingqs@users.noreply.github.com>',
    'Mattias Amnefelt <mattiasa@cantemo.com>',
    'Michael Kühnel <mail@michael-kuehnel.de>',
    'Michael Williamson <mike@zwobble.org>',
    'Paul Mandel <paul.mand3l@gmail.com>',
    'Peter Uithoven <peter@peteruithoven.nl>',
    'Philipp Tusch <philipp.tusch@huf-group.com>',
    'Rogier Schouten <github@workingcode.nl>',
    'Stan Senotrusov <stan@senotrusov.com>',
    'Stoyan Revov <st.revov@gmail.com>',
    'Tero Keski-Valkama <tero.keski-valkama@cybercom.com>',
    'Thomas Grainger <tagrain@gmail.com>',
    'Tim Brust <tim.brust@sinnerschrader.com>',
    'Tim Oxley <secoif@gmail.com>',
    'Timothée Mazzucotelli <timothee.mazzucotelli@gmail.com>',
    'Tobi <tobilg@gmail.com>',
    'Tobias Büschel <tobias.bueschel@gmail.com>',
    'Yukari Ishibashi <ibeucaly@users.noreply.github.com>',
    'Yuri Zapuchlak <yuri@vidmaker.com>',
    'badunk <baduncaduncan@gmail.com>',
    'creising <creising@gmail.com>',
    'gdw2 <gdwarner@Gmail.com>',
    'ktmouk <ktmouk@gmail.com>',
    'santiagocanti <santiago.canti@auth0.com>',
    'tbbstny <tbbstny@users.noreply.github.com>',
    'zodiac403 <zodiac403@gmx.de>',
]; //clear it

GitContributors.list(opts, function (err, result) {
    result.forEach(function (item) {
        json.contributors.push([item.name, `<${item.email}>`].join(' '));
    });

    json.contributors.sort();

    format(pkg, json, function () {
        console.log(`Wrote ${result.length} contributors to: ${pkg}`);
    });
});
