let huE_bridges = {

	get() {
		let bridgesTabContent = $('#bridges-tab-content');

		huE_common.setSpinner(bridgesTabContent, $.i18n('bridges-loading'));

		huE_common.huejay.discover()
			.then(bridges => {
				// separate the connected bridge from all others
				let otherBridges = [];
				for (let discoveredBridge of bridges) {
					if (discoveredBridge.ip != huE_common.config.get(CONFIG_KEYS.bridgeIp)) {
						otherBridges.push(discoveredBridge);
					}
				}

				// now fetch the details for the currently connected bridge and then show the template
				huE_common.huejayClient.bridge.get()
					.then(bridge => {
						let templateContext = {	connectedBridge: bridge,
												otherBridges: otherBridges };

						huE_common.setTemplate(bridgesTabContent, 'hbs/bridges.hbs', templateContext);
					});
			});
	},

	pingBridgeAndInitiatePushlink(bridgeIp, bridgeId) {
		let pushLinkContent = $('#main-content-pushlink');

		let client = new huE_common.huejay.Client({
			host: bridgeIp
		});

		client.bridge.ping()
			.then(() => {
				// ping was successful; show pushlink
				let templateContext = {	bridgeIp: bridgeIp,
										bridgeId: bridgeId };

				huE_common.setTemplate(pushLinkContent, 'hbs/pushlink.hbs', templateContext);
				huE_common.switchToMainContentElement('pushlink');
			})
			.catch(error => {
				huE_common.showError($.i18n('error-label-general'), $.i18n('error-msg-ping-failed'));
				huE_bridges.showBridgeDiscovery()
			});
	},

	createUser(bridgeIp, bridgeId) {
		let client = new huE_common.huejay.Client({
			host: bridgeIp
		});

		let user = new client.users.User;
		user.deviceType = APP_BRIDGEUSER_DEVICETYPE + '#' + huE_common.os.hostname();

		client.users.create(user)
			.then(user => {
				huE_common.config.set(CONFIG_KEYS.bridgeIp, bridgeIp);
				huE_common.config.set(CONFIG_KEYS.bridgeId, bridgeId);
				huE_common.config.set(CONFIG_KEYS.userName, user.username);

				huE_common.huejayClient = new huE_common.huejay.Client({
					host: huE_common.config.get(CONFIG_KEYS.bridgeIp),
					username: huE_common.config.get(CONFIG_KEYS.userName)
				});

				huE_common.switchToMainContentElement('tabs');

				$('.nav-tabs a:first').tab('show');
			})
			.catch(error => {
				if (error instanceof huE_common.huejay.Error && error.type === 101) {
					huE_common.showError($.i18n('error-label-general'), $.i18n('error-msg-pushlink-failed'));
				} else {
					huE_common.showError($.i18n('error-label-general'), error.message);
				}
			});
	},

	showBridgeDiscovery() {
		let bridgeDiscoveryContent = $('#main-content-bridge-discovery');

		huE_common.switchToMainContentElement('bridge-discovery');
		huE_common.setSpinner(bridgeDiscoveryContent, $.i18n('bridges-discovering'));

		huE_common.huejay.discover({strategy: 'all'})
			.then(bridges => {
				huE_common.setTemplate(bridgeDiscoveryContent, 'hbs/bridge-discovery.hbs', {bridges: bridges});
			})
			.catch(error => {
				huE_common.showError($.i18n('error-label-general'), $.i18n('error-msg-bridge-discovery-failed'));
			});
	},

	save(bridgeData) {
		huE_common.huejayClient.bridge.get()
			.then(bridge => {
				bridge.name = bridgeData.name;

				return huE_common.huejayClient.bridge.save(bridge);
			})
			.then(bridge => {
				let onHiddenCallback = function() { huE_bridges.get() };
				huE_common.showSuccess($.i18n('success-label-general'), $.i18n('success-msg-bridge-settings'), onHiddenCallback);
			})
			.catch(error => {
				huE_common.showError($.i18n('error-label-general'), error.message);
			});
	}

};
