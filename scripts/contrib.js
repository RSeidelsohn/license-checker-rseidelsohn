#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPOSITORY_ROOT = resolve(import.meta.dirname, '..');
const PACKAGE_JSON_PATH = resolve(REPOSITORY_ROOT, 'package.json');
const CONTRIBUTOR_PATTERN = /^(?<name>.+?) <(?<email>[^>]+)>$/;

export const LEGACY_CONTRIBUTORS = [
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
];

export const readPackageJson = async () => JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf8'));

export const formatContributor = (name, email) => `${name.trim()} <${email.trim()}>`;

export const isBotContributor = (name, email) => name.includes('[bot]') || email.includes('[bot]');

export const parseContributor = contributor => {
	const match = CONTRIBUTOR_PATTERN.exec(contributor);

	if (!match?.groups) {
		return;
	}

	return {
		contributor,
		email: match.groups.email.trim(),
		name: match.groups.name.trim(),
	};
};

const isLikelyFullName = name => name.includes(' ');

const selectPreferredContributor = (currentContributor, candidateContributor) => {
	if (!currentContributor) {
		return candidateContributor;
	}

	const currentHasFullName = isLikelyFullName(currentContributor.name);
	const candidateHasFullName = isLikelyFullName(candidateContributor.name);

	if (currentHasFullName !== candidateHasFullName) {
		return candidateHasFullName ? candidateContributor : currentContributor;
	}

	if (currentContributor.name.length !== candidateContributor.name.length) {
		return candidateContributor.name.length > currentContributor.name.length
			? candidateContributor
			: currentContributor;
	}

	return candidateContributor.contributor < currentContributor.contributor ? candidateContributor : currentContributor;
};

export const uniqueSorted = contributors => {
	const contributorsByEmail = new Map();
	const contributorsWithoutEmail = [];

	for (const contributor of contributors) {
		const parsedContributor = parseContributor(contributor);

		if (!parsedContributor) {
			contributorsWithoutEmail.push(contributor);
			continue;
		}

		const emailKey = parsedContributor.email.toLowerCase();
		const preferredContributor = selectPreferredContributor(contributorsByEmail.get(emailKey), parsedContributor);

		contributorsByEmail.set(emailKey, preferredContributor);
	}

	return [
		...new Set([
			...Array.from(contributorsByEmail.values(), ({ contributor }) => contributor),
			...contributorsWithoutEmail,
		]),
	].sort();
};

const parseGitContributor = line => {
	const [name, email] = line.split('\t');

	return { email, name };
};

export const getGitContributors = async () => {
	const { stdout } = await execFileAsync('git', ['log', '--format=%an%x09%ae'], {
		cwd: REPOSITORY_ROOT,
		encoding: 'utf8',
	});

	return uniqueSorted(
		stdout
			.split('\n')
			.filter(Boolean)
			.map(parseGitContributor)
			.filter(({ email, name }) => name && email && !isBotContributor(name, email))
			.map(({ email, name }) => formatContributor(name, email))
	);
};

export const writePackageJson = async packageJson => {
	await writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, '\t')}\n`);
};

export const main = async () => {
	const packageJson = await readPackageJson();
	const gitContributors = await getGitContributors();
	const contributors = uniqueSorted([...LEGACY_CONTRIBUTORS, ...gitContributors]);

	packageJson.contributors = contributors;
	await writePackageJson(packageJson);

	console.log(
		`Wrote ${contributors.length} contributors to: ${PACKAGE_JSON_PATH} ` +
			`(${LEGACY_CONTRIBUTORS.length} legacy, ${gitContributors.length} git)`
	);
};

if (import.meta.main) {
	await main();
}
