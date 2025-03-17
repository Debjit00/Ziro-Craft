document.addEventListener('DOMContentLoaded', () => {
    const artisansData = [
        {
            state: "Arunachal Pradesh",
            craft: "Wood Carving & Carpet Weaving",
            description: "Famous for its fine wood carving and handwoven carpets made by Monpa and Sherdukpen tribes.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924115_image.png",
            video: "https://youtu.be/aTqfsiR_Ans?si=uCZk9bM_yLBQObuR"
        },
        {
            state: "Assam",
            craft: "Silk Weaving (Muga, Eri, Pat Silk)",
            description: "Globally known for silk weaving, producing Muga, Eri, and Pat silk fabrics.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924186_image.png",
            video: "https://www.youtube.com/watch?v=UFuD7EyREYM"
        },
        {
            state: "Manipur",
            craft: "Handloom & Black Pottery",
            description: "Famous for Longpi black pottery and colorful handwoven textiles.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924259_image.png",
            video: "https://www.youtube.com/watch?v=TEwJlMNSs2M"
        },
        {
            state: "Meghalaya",
            craft: "Bamboo & Cane Craft",
            description: "Renowned for beautifully crafted bamboo and cane products, including mats, baskets, and furniture.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924289_image.png",
            video: "https://www.youtube.com/watch?v=JDY8tV5N3m8"
        },
        {
            state: "Mizoram",
            craft: "Bamboo Baskets & Handwoven Shawls",
            description: "Mizoram artisans create intricate bamboo baskets and traditional Mizo shawls using indigenous techniques.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924317_image.png",
            video: "https://www.youtube.com/watch?v=SHcA9ENSBCM"
        },
        {
            state: "Nagaland",
            craft: "Tribal Handicrafts & Naga Shawls",
            description: "Known for vibrant Naga shawls, beadwork, and wood carvings reflecting tribal heritage.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924331_image.png",
            video: "https://www.youtube.com/watch?v=wdxK22LTMNo"
        },
        {
            state: "Sikkim",
            craft: "Thangka Paintings & Carpet Weaving",
            description: "Home to exquisite Thangka paintings and handwoven carpets deeply rooted in Buddhist traditions.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924354_image.png",
            video: "https://www.youtube.com/watch?v=A9d7K0B1tyQ"
        },
        {
            state: "Tripura",
            craft: "Cane & Bamboo Furniture",
            description: "Tripura artisans excel in making durable and beautifully designed cane and bamboo furniture.",
            image: "https://static.getkraft.com/users/1/blog/images/1589924406_image.png",
            video: "https://www.youtube.com/watch?v=ptBaUhk__Dg"
        }
    ];

    const container = document.getElementById('artisans-container');

    artisansData.forEach(artisan => {
        const artisanDiv = document.createElement('div');
        artisanDiv.classList.add('artisan-card');

        artisanDiv.innerHTML = `
            <img src="${artisan.image}" alt="${artisan.state}">
            <div class="artisan-info">
                <h2>${artisan.state}</h2>
                <h3>${artisan.craft}</h3>
                <p>${artisan.description}</p>
                <a href="${artisan.video}" class="btn">Explore 💫</a>
            </div>
        `;

        container.appendChild(artisanDiv);
    });
});
