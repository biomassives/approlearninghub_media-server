// cloud/main.js

Parse.Cloud.define("hello", async (request) => {
    return "Hello from Parse Cloud Code!";
});

// --- New Cloud Function for Importing Data ---
Parse.Cloud.define("importApprovideoContent", async (request) => {
    // Your large JSON data array
    // For brevity in this example, I'm showing a placeholder.
    // You would paste your entire JSON array here.
    const importData = [
      {
        "area": "Shelter",
        "icon": "fa-home",
        "featherIcon": "home",
        "svgString": "<svg ... >...</svg>", // Actual SVG string
        "subcategories": [
          {
            "uniqueId": "shelter-0",
            "title": "Methods",
            // ... other subcategory fields ...
            "videos": [
              {
                "title": "Building The Perfect Gabion Retaining Wall (2024)!",
                "youtubeId": "vHfN4gYFgu8",
                // ... other video fields ...
              }
              // ... more videos ...
            ]
          }
          // ... more subcategories ...
        ]
      }
      // ... more areas ...
    ]; // PASTE YOUR FULL JSON ARRAY HERE


    const results = {
        areasCreated: 0,
        subcategoriesCreated: 0,
        videosCreated: 0,
        errors: []
    };

    // Define Parse Classes
    const Area = Parse.Object.extend("Area");
    const Subcategory = Parse.Object.extend("Subcategory");
    const Video = Parse.Object.extend("Video");

    // --- Loop through Areas ---
    for (const areaData of importData) {
        try {
            // Check if Area already exists by name to avoid duplicates
            let areaQuery = new Parse.Query(Area);
            areaQuery.equalTo("name", areaData.area);
            let area = await areaQuery.first({ useMasterKey: true }); // useMasterKey if your CLPs are restrictive

            if (!area) {
                area = new Area();
                area.set("name", areaData.area);
                area.set("iconFA", areaData.icon);
                area.set("iconFeather", areaData.featherIcon);
                area.set("iconSVG", areaData.svgString);
                // Add ACLs if needed:
                // const acl = new Parse.ACL();
                // acl.setPublicReadAccess(true);
                // acl.setPublicWriteAccess(false); // Only allow writes via Cloud Code or specific roles
                // area.setACL(acl);
                await area.save(null, { useMasterKey: true });
                results.areasCreated++;
                console.log(`Created Area: ${areaData.area}`);
            } else {
                console.log(`Area already exists: ${areaData.area}`);
            }

            // --- Loop through Subcategories for this Area ---
            if (areaData.subcategories && areaData.subcategories.length > 0) {
                for (const subcategoryData of areaData.subcategories) {
                    try {
                        let subcategoryQuery = new Parse.Query(Subcategory);
                        subcategoryQuery.equalTo("subcategoryId", subcategoryData.uniqueId);
                        let subcategory = await subcategoryQuery.first({ useMasterKey: true });

                        if (!subcategory) {
                            subcategory = new Subcategory();
                            subcategory.set("subcategoryId", subcategoryData.uniqueId);
                            subcategory.set("title", subcategoryData.title);
                            subcategory.set("subtitle", subcategoryData.subtitle);
                            subcategory.set("description", subcategoryData.description);
                            subcategory.set("tags", subcategoryData.tags); // Array
                            subcategory.set("context", subcategoryData.context);
                            subcategory.set("materials", subcategoryData.materials); // Array
                            subcategory.set("processSteps", subcategoryData.processSteps); // Array
                            subcategory.set("parentArea", area); // Set Pointer to the Area object

                            // subcategory.setACL(acl); // Set ACLs if needed
                            await subcategory.save(null, { useMasterKey: true });
                            results.subcategoriesCreated++;
                            console.log(`  Created Subcategory: ${subcategoryData.title} (under ${areaData.area})`);
                        } else {
                            console.log(`  Subcategory already exists: ${subcategoryData.title}`);
                            // Optionally, update existing subcategory if needed
                        }


                        // --- Loop through Videos for this Subcategory ---
                        if (subcategoryData.videos && subcategoryData.videos.length > 0) {
                            for (const videoData of subcategoryData.videos) {
                                try {
                                    let videoQuery = new Parse.Query(Video);
                                    videoQuery.equalTo("youtubeId", videoData.youtubeId);
                                    let video = await videoQuery.first({ useMasterKey: true });

                                    if(!video) {
                                        video = new Video();
                                        video.set("youtubeId", videoData.youtubeId);
                                        video.set("title", videoData.title);
                                        video.set("videoDescription", videoData.description); // Use "videoDescription"
                                        video.set("videoTags", videoData.tags); // String or Array
                                        video.set("iconFA", videoData.icon_tag_fa);
                                        video.set("colorTag", videoData.color_tag);
                                        video.set("localFilename", videoData.localVideoFilename);
                                        video.set("authors", videoData.authors);
                                        video.set("licence", videoData.licence);
                                        video.set("patreonURL", videoData.patreon);
                                        video.set("socials", videoData.socials); // Object
                                        video.set("fundraiserURL", videoData.fundraiser);
                                        video.set("sponsorPages", videoData.sponsorPages); // Array
                                        video.set("contentCreatorArchiveURL", videoData.contentCreatorArchive);
                                        if (videoData.youtubeType) {
                                            video.set("youtubeType", videoData.youtubeType);
                                        }
                                        video.set("parentSubcategory", subcategory); // Set Pointer

                                        // video.setACL(acl); // Set ACLs if needed
                                        await video.save(null, { useMasterKey: true });
                                        results.videosCreated++;
                                        console.log(`    Created Video: ${videoData.title} (under ${subcategoryData.title})`);
                                    } else {
                                        console.log(`    Video already exists: ${videoData.title}`);
                                        // Optionally, update existing video
                                    }
                                } catch (videoError) {
                                    const errorMsg = `Error saving Video "${videoData.title}": ${videoError.message}`;
                                    console.error(errorMsg, videoError);
                                    results.errors.push(errorMsg);
                                }
                            }
                        }
                    } catch (subcategoryError) {
                        const errorMsg = `Error saving Subcategory "${subcategoryData.title}": ${subcategoryError.message}`;
                        console.error(errorMsg, subcategoryError);
                        results.errors.push(errorMsg);
                    }
                }
            }
        } catch (areaError) {
            const errorMsg = `Error saving Area "${areaData.area}": ${areaError.message}`;
            console.error(errorMsg, areaError);
            results.errors.push(errorMsg);
        }
    }

    if (results.errors.length > 0) {
        return `Import finished with ${results.errors.length} errors. Areas: ${results.areasCreated}, Subcategories: ${results.subcategoriesCreated}, Videos: ${results.videosCreated}. Check server logs for error details.`;
    }
    return `Import successful! Areas: ${results.areasCreated}, Subcategories: ${results.subcategoriesCreated}, Videos: ${results.videosCreated}.`;
});
