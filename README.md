# Super-Simple-Share-Buttons
Just include one *.js and you're ready to go.

No Jquery, no other dependencies, even styles are inside one js.
After adding script to page init with:<br/>
<pre>
shareButtons()
</pre>
Buttons are responsive.<br/>
Default options are:
<pre>
 var img = getMetaContentByName('og:image');
    if (!img) {
        document.querySelectorAll('img').length ? img = document.querySelectorAll('img')[0].src : img = 'https://placehold.it/350x150';
    }
    var descr = getMetaContentByName('description');
    if (!descr) descr = 'https://github.com/michaeleparkour/Super-Simple-Share-Buttons/'
    var optionsDef = {
        url: location.href,
        title: document.title,
        image: img,
        text: descr,
        width: 512,
        height: 512,
        services: ['facebook', 'gplus']
    };
</pre>
Styles added for next services:
<pre>
var services = ['facebook', 'twitter', 'linkedin', 'gplus', 'vk', 'email', 'pinterest'];
</pre>
You are welcome to add styles and counter methods for another services and networks.<br/>
Play here <a href="http://michaeleparkour.github.io/Super-Simple-Share-Buttons">Demo</a>
