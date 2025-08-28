test:
	firebase emulators:start

deploy:
	git add .
	git commit -m "commit $(shell date +'%m/%d/%Y %H:%M:%S')"
	git push
	firebase login
	firebase deploy